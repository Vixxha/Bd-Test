export interface Product {
  id: string;
  sku: string;
  name: string;
  sell_type: 'unit' | 'weight'; // 'unit' (envasado), 'weight' (granel en kg)
  price: number;
  original_price?: number;
  sale_price?: number | null;
  weight?: number;
  stock: number;
  description: string;
  image_url: string;
  
  // Unstructured details (stored in MongoDB or postgres JSONB)
  category: string; // 'almendras' | 'nueces' | 'pistachos' | 'anacardos' | 'semillas' | 'harinas' | 'aceites' | 'endulzantes' | 'deshidratados'
  origin?: string;
  nutrition?: {
    calories: number; // por 100g
    carbohydrates: number; // en g
    protein: number; // en g
    fat: number; // en g
    fiber: number; // en g
  };
  allergens?: string[];
  tags?: string[];
  packaging_info?: string;
  rating?: number; // 0 a 5
  reviews_count?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number; // puede ser decimal para granel (ej. 0.250)
  price: number; // precio histórico de venta
  product?: Product;
}

export interface Order {
  id: string;
  total_amount: number;
  payment_method: 'cash' | 'debit' | 'credit' | 'transfer';
  created_at: string;
  closure_id?: string | null;
  items?: OrderItem[];
  
  // Unstructured metadata (stored in MongoDB web_orders_analytics collection)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  status: 'pending' | 'completed' | 'cancelled';
  user_agent?: string;
  ip_address?: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // puede ser decimal
}

export interface CheckoutFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: 'cash' | 'debit' | 'credit' | 'transfer';
}
