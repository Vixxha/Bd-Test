import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Product, Order, OrderItem } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- LOCAL FILE FALLBACK SIMULATOR ---
const getDbJsonPath = () => path.join(process.cwd(), 'lib', 'db.json');

async function readLocalDb(): Promise<any> {
  const filePath = getDbJsonPath();
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local db.json, returning empty structure:', err);
    return { postgres_products: [], mongodb_product_details: [], postgres_orders: [], postgres_order_items: [], mongodb_orders_analytics: [] };
  }
}

async function writeLocalDb(data: any): Promise<void> {
  const filePath = getDbJsonPath();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local db.json:', err);
  }
}

// --- DB INTERFACE IMPLEMENTATION ---

export async function getProductos(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Fetch only active products that are in stock (as per requirement 4)
      const { data, error } = await supabase
        .from('products')
        .select('*, product_details(*), categories(*)')
        .eq('is_active', true)
        .gt('stock', 0);
      
      if (error) throw error;
      
      return (data || []).map((p: any) => {
        const details = p.product_details || {};
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          sell_type: p.sell_type as 'unit' | 'weight',
          price: p.sale_price ? Number(p.sale_price) : Number(p.price), // Support sale_price
          original_price: Number(p.price),
          sale_price: p.sale_price ? Number(p.sale_price) : null,
          stock: Number(p.stock),
          weight: p.weight ? Number(p.weight) : 0,
          description: p.description || '',
          image_url: p.image_url || '',
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
    } catch (err) {
      console.error('Supabase query failed in getProductos, falling back to local files...', err);
    }
  }

  // Fallback to Local JSON DB File
  const db = await readLocalDb();
  const pgProducts = db.postgres_products;
  const mongoProducts = db.mongodb_product_details;

  return pgProducts
    .filter((p: any) => p.stock > 0) // fallback stock > 0 filter
    .map((pgProd: any) => {
      const doc = mongoProducts.find((m: any) => m.sku === pgProd.sku);
      return {
        id: pgProd.id,
        sku: pgProd.sku,
        name: pgProd.name,
        sell_type: pgProd.sell_type,
        price: Number(pgProd.price),
        stock: Number(pgProd.stock),
        description: pgProd.description || '',
        image_url: pgProd.image_url || '',
        category: doc?.category || 'otros',
        origin: doc?.origin || '',
        nutrition: doc?.nutrition || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 },
        allergens: doc?.allergens || [],
        tags: doc?.tags || [],
        packaging_info: doc?.packaging_info || '',
        rating: doc?.rating || 5.0,
        reviews_count: doc?.reviews_count || 0
      };
    });
}

export async function getProductoById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_details(*), categories(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;

      const details = data.product_details || {};
      return {
        id: data.id,
        sku: data.sku,
        name: data.name,
        sell_type: data.sell_type as 'unit' | 'weight',
        price: data.sale_price ? Number(data.sale_price) : Number(data.price),
        original_price: Number(data.price),
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        stock: Number(data.stock),
        weight: data.weight ? Number(data.weight) : 0,
        description: data.description || '',
        image_url: data.image_url || '',
        category: data.categories?.slug || details.category || 'otros',
        origin: details.origin || '',
        nutrition: details.nutrition || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 },
        allergens: details.allergens || [],
        tags: details.tags || [],
        packaging_info: details.packaging_info || '',
        rating: details.rating ? Number(details.rating) : 5.0,
        reviews_count: details.reviews_count || 0
      };
    } catch (err) {
      console.error(`Supabase query failed in getProductoById for id ${id}, falling back...`, err);
    }
  }

  // Local file fallback
  const db = await readLocalDb();
  const pgProd = db.postgres_products.find((p: any) => p.id === id);
  if (!pgProd) return null;
  const doc = db.mongodb_product_details.find((m: any) => m.sku === pgProd.sku);

  return {
    id: pgProd.id,
    sku: pgProd.sku,
    name: pgProd.name,
    sell_type: pgProd.sell_type,
    price: Number(pgProd.price),
    stock: Number(pgProd.stock),
    description: pgProd.description || '',
    image_url: pgProd.image_url || '',
    category: doc?.category || 'otros',
    origin: doc?.origin || '',
    nutrition: doc?.nutrition || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 },
    allergens: doc?.allergens || [],
    tags: doc?.tags || [],
    packaging_info: doc?.packaging_info || '',
    rating: doc?.rating || 5.0,
    reviews_count: doc?.reviews_count || 0
  };
}

export async function getCategories(): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching categories from Supabase:', err);
    }
  }

  // Local/UI default fallback
  return [
    { name: 'Nueces', slug: 'nueces', desc: 'Mariposa seleccionadas', color: 'bg-emerald-50 text-primary border-emerald-100' },
    { name: 'Almendras', slug: 'almendras', desc: 'Calibre gigante natural', color: 'bg-amber-50 text-amber-800 border-amber-100' },
    { name: 'Anacardos', slug: 'anacardos', desc: 'Castañas de cajú premium', color: 'bg-orange-50/50 text-orange-900 border-orange-100/50' },
    { name: 'Semillas', slug: 'semillas', desc: 'Superalimentos naturales', color: 'bg-teal-50 text-teal-800 border-teal-100' },
    { name: 'Aceites y Cremas', slug: 'aceites', desc: 'Orgánicos y prensados', color: 'bg-blue-50/50 text-blue-900 border-blue-100/50' },
  ];
}

export async function crearVenta(data: Omit<Order, 'id' | 'created_at'> & { items: { product_id: string; quantity: number; price: number }[] }): Promise<Order> {
  const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
  const createdAt = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert order into the unified orders table (the DB trigger normalized fields and total_amount)
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          total: data.total_amount,
          total_amount: data.total_amount,
          payment_method: data.payment_method,
          customer_name: data.customer_name || 'Web Cliente',
          customer_email: data.customer_email || '',
          customer_phone: data.customer_phone || '',
          shipping_address: data.shipping_address || '',
          shipping_city: data.shipping_city || '',
          status: 'pendiente', // Web orders start in 'pendiente' status
          created_at: createdAt
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert items (the Postgres trigger adjust_stock_on_order_item handles the stock decrement atomically!)
      const createdItems: OrderItem[] = [];
      for (const item of data.items) {
        const itemId = 'oi_' + Math.random().toString(36).substr(2, 9);
        const { data: itemData, error: itemErr } = await supabase
          .from('order_items')
          .insert({
            id: itemId,
            order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            created_at: createdAt
          })
          .select()
          .single();
        
        if (itemErr) throw itemErr;
        createdItems.push(itemData);
      }

      return {
        id: orderData.id,
        total_amount: data.total_amount,
        payment_method: data.payment_method,
        created_at: createdAt,
        closure_id: null,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        shipping_address: data.shipping_address,
        shipping_city: data.shipping_city,
        status: 'pending',
        items: createdItems.map((i: any) => ({
          id: i.id,
          order_id: i.order_id,
          product_id: i.product_id,
          quantity: Number(i.quantity),
          price: Number(i.price)
        }))
      };
    } catch (err) {
      console.error('Supabase transaction failed in crearVenta, falling back...', err);
    }
  }

  // Fallback to Local JSON DB File
  const db = await readLocalDb();
  
  const newOrder: Order = {
    id: orderId,
    total_amount: data.total_amount,
    payment_method: data.payment_method,
    created_at: createdAt,
    closure_id: null,
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    shipping_address: data.shipping_address,
    shipping_city: data.shipping_city,
    status: 'pending'
  };

  const newItems: OrderItem[] = data.items.map(item => {
    const itemId = 'oi_' + Math.random().toString(36).substr(2, 9);
    const localProduct = db.postgres_products.find((p: any) => p.id === item.product_id);
    if (localProduct) {
      localProduct.stock = Number(Math.max(0, localProduct.stock - item.quantity).toFixed(3));
    }
    return {
      id: itemId,
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: createdAt
    };
  });

  db.postgres_orders.push(newOrder);
  db.postgres_order_items.push(...newItems);

  const mongoAnalyticsDoc = {
    order_id: orderId,
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    shipping_address: data.shipping_address,
    shipping_city: data.shipping_city,
    total_amount: data.total_amount,
    payment_method: data.payment_method,
    created_at: createdAt,
    status: 'pending',
    user_agent: data.user_agent,
    ip_address: data.ip_address,
    items: data.items
  };
  db.mongodb_orders_analytics.push(mongoAnalyticsDoc);

  await writeLocalDb(db);

  return {
    ...newOrder,
    items: newItems
  };
}

export async function getVentas(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*))
        `)
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      return (ordersData || []).map((o: any) => {
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
          payment_method: o.payment_method,
          created_at: o.created_at,
          closure_id: o.closure_id,
          customer_name: o.customer_name || 'POS Cliente',
          customer_email: o.customer_email || '',
          customer_phone: o.customer_phone || '',
          shipping_address: o.shipping_address || '',
          shipping_city: o.shipping_city || '',
          status: o.status || 'completed',
          items: items
        };
      });
    } catch (err) {
      console.error('Supabase query failed in getVentas, falling back...', err);
    }
  }

  // Local fallback
  const db = await readLocalDb();
  const products = await getProductos();

  return db.postgres_orders.map((o: any) => {
    const analytics = db.mongodb_orders_analytics.find((m: any) => m.order_id === o.id);
    const orderItems = db.postgres_order_items
      .filter((i: any) => i.order_id === o.id)
      .map((i: any) => ({
        ...i,
        product: products.find(p => p.id === i.product_id)
      }));

    return {
      ...o,
      customer_name: analytics?.customer_name || 'POS Cliente',
      customer_email: analytics?.customer_email || '',
      customer_phone: analytics?.customer_phone || '',
      shipping_address: analytics?.shipping_address || '',
      shipping_city: analytics?.shipping_city || '',
      status: analytics?.status || 'completed',
      items: orderItems
    };
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// --- DYNAMIC HOME CONTENT LOADER ---
export async function getWebPageContent(key: string): Promise<any> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section_name', key)
        .single();
      
      if (!error && data) {
        return {
          title: data.title || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          badge: data.title ? data.title.split('|')[1] || '' : '', // support custom layouts if needed
          button_primary_text: data.button_text || '',
          button_secondary_text: 'Ver Ofertas', // default sub CTA
          image_url: data.image_url || ''
        };
      }
    } catch (err) {
      console.error(`Error loading page content for key ${key} from Supabase:`, err);
    }
  }

  // Fallback to local default structures
  const defaultContents: Record<string, any> = {
    hero: {
      title: "Alimentación pura e inteligente para tu día.",
      subtitle: "Descubre nuestra variedad de frutos secos a granel y productos envasados orgánicos. 100% natural, sin aditivos, seleccionados a mano para garantizar frescura y calidad superior.",
      badge: "Calidad de Selección Premium",
      button_primary_text: "Ver Catálogo",
      button_secondary_text: "Ver Nueces Peladas",
      image_url: ""
    },
    shipping: {
      title: "Despacho Rápido",
      subtitle: "Envío gratuito en Santiago por compras superiores a $25.000. Despachos en 24-48 horas."
    },
    natural_origin: {
      title: "Origen Natural",
      subtitle: "Productos libres de aditivos artificiales, pesticidas y preservantes químicos. 100% natural."
    },
    secure_shopping: {
      title: "Compra Segura",
      subtitle: "Stock y ventas sincronizadas en tiempo real con nuestra tienda física y POS de administración."
    }
  };

  return defaultContents[key] || null;
}
