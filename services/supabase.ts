import { createClient } from '@supabase/supabase-js';

// Domain Interfaces
export interface Product {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  sell_type: 'unit' | 'weight'; // 'unit' (per unit), 'weight' (per weight/bulk in kg)
  price: number;
  sale_price?: number | null;
  stock: number;
  weight?: number;
  category_id?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  // Extended details (previously in MongoDB, stored in product_details)
  category?: string;
  origin?: string;
  nutrition?: {
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
    fiber: number;
  };
  allergens?: string[];
  tags?: string[];
  packaging_info?: string;
  rating?: number;
  reviews_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  active: boolean;
  created_at?: string;
  itemCount?: number;
}

export interface Order {
  id: string;
  total_amount: number;
  payment_method: 'cash' | 'debit' | 'credit' | 'transfer' | 'efectivo' | 'débito' | 'crédito' | 'transferencia';
  created_at: string;
  closure_id: string | null;
  items?: OrderItem[];
  // Web order details
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'pendiente' | 'preparando' | 'enviado' | 'entregado';
  user_agent?: string;
  ip_address?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface CashClosure {
  id: string;
  opened_at: string;
  closed_at: string;
  sales_count: number;
  total_amount: number;
  cash_total: number;
  debit_total: number;
  credit_total: number;
  transfer_total: number;
  created_at: string;
}

// Helper function to generate slugs
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, '-')           // replace spaces with -
    .replace(/[^\w\-]+/g, '')       // remove all non-word chars
    .replace(/\-\-+/g, '-')         // replace multiple - with single -
    .replace(/^-+/, '')             // trim - from start
    .replace(/-+$/, '');            // trim - from end
}

// 1. Supabase Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Memory Event Listeners for local sync callbacks (used in fallback/realtime)
type ListenerCallback = (payload: any) => void;
const productListeners = new Set<ListenerCallback>();
const orderListeners = new Set<ListenerCallback>();
const closureListeners = new Set<ListenerCallback>();
const categoryListeners = new Set<ListenerCallback>();

// Database Service Adapter
export const dbService = {
  isSupabaseConfigured,

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      // Fetch categories and count items per category
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*, products(id)')
        .order('name', { ascending: true });

      if (catErr) {
        console.error('Error fetching categories from Supabase:', catErr);
        return [];
      }

      return (catData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image || '',
        active: c.active,
        created_at: c.created_at,
        itemCount: c.products ? c.products.length : 0
      }));
    }
    return [];
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      const slug = cat.slug || generateSlug(cat.name);
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: cat.name,
          slug,
          image: cat.image || '',
          active: cat.active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      this.notifyCategoriesChange({ eventType: 'INSERT', new: data });
      return data;
    }
    throw new Error('Supabase not configured');
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const updates: any = {};
      if (cat.name !== undefined) {
        updates.name = cat.name;
        updates.slug = generateSlug(cat.name);
      }
      if (cat.image !== undefined) updates.image = cat.image;
      if (cat.active !== undefined) updates.active = cat.active;

      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      this.notifyCategoriesChange({ eventType: 'UPDATE' });
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      this.notifyCategoriesChange({ eventType: 'DELETE', old: { id } });
    }
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_details(*), categories(*)');
      if (error) {
        console.error('Error fetching products from Supabase:', error);
        return [];
      }
      return (data || []).map((p: any) => {
        const details = p.product_details || {};
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          slug: p.slug,
          sell_type: p.sell_type as 'unit' | 'weight',
          price: Number(p.price),
          sale_price: p.sale_price ? Number(p.sale_price) : null,
          stock: Number(p.stock),
          weight: p.weight ? Number(p.weight) : 0,
          category_id: p.category_id,
          is_featured: p.is_featured,
          is_active: p.is_active,
          description: p.description || '',
          image_url: p.image_url || '',
          created_at: p.created_at,
          updated_at: p.updated_at,
          // Sync category label for existing POS UI which expects text string
          category: p.categories?.slug || details.category || 'otros',
          origin: details.origin || '',
          nutrition: details.nutrition || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 },
          allergens: details.allergens || [],
          tags: details.tags || [],
          packaging_info: details.packaging_info || '',
          rating: details.rating ? Number(details.rating) : 5.0,
          reviews_count: details.reviews_count || 0
        };
      });
    }
    return [];
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      const slug = product.slug || generateSlug(product.name);
      
      const { data: mainProduct, error: mainErr } = await supabase
        .from('products')
        .insert({
          sku: product.sku,
          name: product.name,
          slug,
          sell_type: product.sell_type,
          price: product.price,
          sale_price: product.sale_price,
          stock: product.stock,
          weight: product.weight || 0,
          category_id: product.category_id || null,
          is_featured: product.is_featured ?? false,
          is_active: product.is_active ?? true,
          description: product.description,
          image_url: product.image_url
        })
        .select()
        .single();

      if (mainErr) throw mainErr;

      // Map category name from category_id if possible
      let categorySlug = 'otros';
      if (product.category_id) {
        const { data: cat } = await supabase.from('categories').select('slug').eq('id', product.category_id).single();
        if (cat) categorySlug = cat.slug;
      } else if (product.category) {
        categorySlug = product.category;
      }

      const { error: detailsErr } = await supabase
        .from('product_details')
        .insert({
          sku: product.sku,
          category: categorySlug,
          origin: product.origin || '',
          nutrition: product.nutrition || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 },
          allergens: product.allergens || [],
          tags: product.tags || [],
          packaging_info: product.packaging_info || '',
          rating: product.rating || 5.0,
          reviews_count: product.reviews_count || 0
        });

      if (detailsErr) console.error('Error inserting product details:', detailsErr);

      this.notifyProductsChange({ eventType: 'INSERT', new: mainProduct });
      
      return {
        ...product,
        id: mainProduct.id,
        slug: mainProduct.slug,
        created_at: mainProduct.created_at
      };
    }
    throw new Error('Supabase not configured');
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const mainUpdates: any = {};
      if (product.name !== undefined) {
        mainUpdates.name = product.name;
        mainUpdates.slug = generateSlug(product.name);
      }
      if (product.price !== undefined) mainUpdates.price = product.price;
      if (product.sale_price !== undefined) mainUpdates.sale_price = product.sale_price;
      if (product.stock !== undefined) mainUpdates.stock = product.stock;
      if (product.description !== undefined) mainUpdates.description = product.description;
      if (product.image_url !== undefined) mainUpdates.image_url = product.image_url;
      if (product.sell_type !== undefined) mainUpdates.sell_type = product.sell_type;
      if (product.weight !== undefined) mainUpdates.weight = product.weight;
      if (product.category_id !== undefined) mainUpdates.category_id = product.category_id;
      if (product.is_featured !== undefined) mainUpdates.is_featured = product.is_featured;
      if (product.is_active !== undefined) mainUpdates.is_active = product.is_active;
      mainUpdates.updated_at = new Date().toISOString();

      if (Object.keys(mainUpdates).length > 0) {
        const { error: mainErr } = await supabase.from('products').update(mainUpdates).eq('id', id);
        if (mainErr) throw mainErr;
      }

      // Sync details table
      const { data: prodData } = await supabase.from('products').select('sku, category_id').eq('id', id).single();
      if (prodData && prodData.sku) {
        const detailsUpdates: any = {};
        if (product.category_id !== undefined) {
          let categorySlug = 'otros';
          if (product.category_id) {
            const { data: cat } = await supabase.from('categories').select('slug').eq('id', product.category_id).single();
            if (cat) categorySlug = cat.slug;
          }
          detailsUpdates.category = categorySlug;
        }
        if (product.origin !== undefined) detailsUpdates.origin = product.origin;
        if (product.nutrition !== undefined) detailsUpdates.nutrition = product.nutrition;
        if (product.allergens !== undefined) detailsUpdates.allergens = product.allergens;
        if (product.tags !== undefined) detailsUpdates.tags = product.tags;
        if (product.packaging_info !== undefined) detailsUpdates.packaging_info = product.packaging_info;
        if (product.rating !== undefined) detailsUpdates.rating = product.rating;
        if (product.reviews_count !== undefined) detailsUpdates.reviews_count = product.reviews_count;

        if (Object.keys(detailsUpdates).length > 0) {
          await supabase.from('product_details').upsert({
            sku: prodData.sku,
            ...detailsUpdates
          });
        }
      }
      this.notifyProductsChange({ eventType: 'UPDATE' });
      return;
    }
  },

  async updateProductStock(id: string, newStock: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .update({ stock: Number(Math.max(0, newStock).toFixed(3)), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      this.notifyProductsChange({ eventType: 'UPDATE' });
      return;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      this.notifyProductsChange({ eventType: 'DELETE', old: { id } });
      return;
    }
  },

  // --- ORDERS / SALES ---
  async createOrder(
    paymentMethod: 'cash' | 'debit' | 'credit' | 'transfer' | 'efectivo' | 'débito' | 'crédito' | 'transferencia',
    items: { product_id: string; quantity: number; price: number }[]
  ): Promise<Order> {
    const totalAmount = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

    if (isSupabaseConfigured && supabase) {
      // Normalize payment method to Spanish for database storage
      let methodNormalized = paymentMethod;
      if (paymentMethod === 'cash') methodNormalized = 'efectivo';
      else if (paymentMethod === 'debit') methodNormalized = 'débito';
      else if (paymentMethod === 'credit') methodNormalized = 'crédito';
      else if (paymentMethod === 'transfer') methodNormalized = 'transferencia';

      // 1. Create order (database trigger normalizes fields & syncs total/total_amount)
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          total: totalAmount,
          total_amount: totalAmount,
          payment_method: methodNormalized,
          customer_name: 'POS Cliente',
          status: 'entregado', // POS sales are completed/delivered immediately
          closure_id: null
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Create order items (database trigger trigger_adjust_stock_on_order_item handles stock updates)
      for (const item of items) {
        const { error: itemErr } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          });
        if (itemErr) console.error('Error inserting order item:', itemErr);
      }

      this.notifyProductsChange({ eventType: 'BULK_UPDATE' });
      this.notifyOrdersChange({ eventType: 'INSERT', new: orderData });
      return orderData;
    }
    throw new Error('Supabase not configured');
  },

  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders from Supabase:', error);
        return [];
      }

      return (data || []).map((o: any) => {
        // Map database Spanish values back to English values expected by POS frontend UI state
        let mappedStatus: 'pending' | 'completed' | 'cancelled' = 'completed';
        if (o.status === 'pendiente') mappedStatus = 'pending';
        else if (o.status === 'entregado') mappedStatus = 'completed';
        else if (o.status === 'cancelado') mappedStatus = 'cancelled';

        let mappedMethod: 'cash' | 'debit' | 'credit' | 'transfer' = 'cash';
        if (o.payment_method === 'efectivo') mappedMethod = 'cash';
        else if (o.payment_method === 'débito') mappedMethod = 'debit';
        else if (o.payment_method === 'crédito') mappedMethod = 'credit';
        else if (o.payment_method === 'transferencia') mappedMethod = 'transfer';

        const items = (o.order_items || []).map((i: any) => ({
          id: i.id,
          order_id: i.order_id,
          product_id: i.product_id,
          quantity: Number(i.quantity),
          price: Number(i.price),
          product: i.products ? {
            id: i.products.id,
            sku: i.products.sku,
            name: i.products.name,
            sell_type: i.products.sell_type,
            price: Number(i.products.price),
            stock: Number(i.products.stock),
            description: i.products.description,
            image_url: i.products.image_url
          } : undefined
        }));

        return {
          id: o.id,
          total_amount: Number(o.total || o.total_amount),
          payment_method: mappedMethod,
          created_at: o.created_at,
          closure_id: o.closure_id,
          customer_name: o.customer_name || 'POS Cliente',
          customer_email: o.customer_email || '',
          customer_phone: o.customer_phone || '',
          shipping_address: o.shipping_address || '',
          shipping_city: o.shipping_city || '',
          status: mappedStatus,
          items: items
        };
      });
    }
    return [];
  },

  async updateWebOrderStatus(orderId: string, status: 'completed' | 'cancelled' | 'pending'): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      let dbStatus = status;
      if (status === 'completed') dbStatus = 'completed'; // Trigger normalizes to entregado
      else if (status === 'cancelled') dbStatus = 'cancelled'; // Trigger normalizes to cancelado
      else if (status === 'pending') dbStatus = 'pending'; // Trigger normalizes to pendiente

      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderId);
      if (error) throw error;
      this.notifyOrdersChange({ eventType: 'UPDATE' });
      return;
    }
  },

  // --- CASH CLOSURES ---
  async getCashClosures(): Promise<CashClosure[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cash_closures')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching closures:', error);
        return [];
      }
      return data || [];
    }
    return [];
  },

  async getActiveOrdersForClosure(): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter(o => o.closure_id === null && o.status !== 'pending');
  },

  async createCashClosure(
    openedAt: string,
    totals: {
      sales_count: number;
      total_amount: number;
      cash_total: number;
      debit_total: number;
      credit_total: number;
      transfer_total: number;
    }
  ): Promise<CashClosure> {
    if (isSupabaseConfigured && supabase) {
      // 1. Create Closure
      const { data: closure, error: closureErr } = await supabase
        .from('cash_closures')
        .insert({
          opened_at: openedAt,
          sales_count: totals.sales_count,
          total_amount: totals.total_amount,
          cash_total: totals.cash_total,
          debit_total: totals.debit_total,
          credit_total: totals.credit_total,
          transfer_total: totals.transfer_total
        })
        .select()
        .single();

      if (closureErr) throw closureErr;

      // 2. Link all active orders
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ closure_id: closure.id })
        .is('closure_id', null);

      if (updateErr) console.error('Error locking active orders to closure:', updateErr);

      this.notifyClosuresChange({ eventType: 'INSERT', new: closure });
      this.notifyOrdersChange({ eventType: 'BULK_UPDATE' });
      return closure;
    }
    throw new Error('Supabase not configured');
  },

  // --- WEB PAGE DYNAMIC CONTENT ---
  async getWebPageContent(key: string): Promise<any> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section_name', key)
        .single();
      
      if (error) {
        console.error(`Error loading web content key ${key}:`, error);
        return null;
      }
      
      return {
        title: data.title || '',
        subtitle: data.subtitle || '',
        description: data.description || '',
        button_text: data.button_text || '',
        button_url: data.button_url || '',
        image_url: data.image_url || ''
      };
    }
    return null;
  },

  async saveWebPageContent(key: string, value: any): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('site_content')
        .upsert({
          section_name: key,
          title: value.title || '',
          subtitle: value.subtitle || '',
          description: value.description || '',
          button_text: value.button_primary_text || value.button_text || '',
          button_url: value.button_primary_url || value.button_url || '',
          image_url: value.image_url || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'section_name'
        });
      
      if (error) throw error;
      return;
    }
  },

  // --- REAL-TIME SUBSCRIPTION METHODS ---
  subscribeToProducts(callback: ListenerCallback): () => void {
    if (isSupabaseConfigured && supabase) {
      const subscription = supabase
        .channel('products-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => callback(payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_details' }, payload => callback(payload))
        .subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
    productListeners.add(callback);
    return () => {
      productListeners.delete(callback);
    };
  },

  subscribeToOrders(callback: ListenerCallback): () => void {
    if (isSupabaseConfigured && supabase) {
      const subscription = supabase
        .channel('orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => callback(payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, payload => callback(payload))
        .subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
    orderListeners.add(callback);
    return () => {
      orderListeners.delete(callback);
    };
  },

  subscribeToClosures(callback: ListenerCallback): () => void {
    if (isSupabaseConfigured && supabase) {
      const subscription = supabase
        .channel('closures-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_closures' }, payload => callback(payload))
        .subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
    closureListeners.add(callback);
    return () => {
      closureListeners.delete(callback);
    };
  },

  subscribeToCategories(callback: ListenerCallback): () => void {
    if (isSupabaseConfigured && supabase) {
      const subscription = supabase
        .channel('categories-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => callback(payload))
        .subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
    categoryListeners.add(callback);
    return () => {
      categoryListeners.delete(callback);
    };
  },

  notifyProductsChange(payload: any) {
    productListeners.forEach(cb => cb(payload));
  },

  notifyOrdersChange(payload: any) {
    orderListeners.forEach(cb => cb(payload));
  },

  notifyClosuresChange(payload: any) {
    closureListeners.forEach(cb => cb(payload));
  },

  notifyCategoriesChange(payload: any) {
    categoryListeners.forEach(cb => cb(payload));
  }
};
