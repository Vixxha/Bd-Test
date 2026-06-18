-- Schema SQL completo para Supabase (PostgreSQL)
-- Combina los modelos relacionales del POS y no-relacionales (MongoDB) del Ecommerce

-- 1. Tabla de Cierres de Caja Diarios (POS)
CREATE TABLE IF NOT EXISTS cash_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sales_count INTEGER NOT NULL CHECK (sales_count >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    cash_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cash_total >= 0),
    debit_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (debit_total >= 0),
    credit_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (credit_total >= 0),
    transfer_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (transfer_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Productos (Core)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sell_type VARCHAR(50) NOT NULL CHECK (sell_type IN ('unit', 'weight')), -- unit (unidad), weight (peso en kg)
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0), -- precio por unidad o precio por Kg
    stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (stock >= 0.000), -- decimal para Kg
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Detalles del Catálogo de Productos (Anteriormente en MongoDB)
CREATE TABLE IF NOT EXISTS product_details (
    sku VARCHAR(100) PRIMARY KEY REFERENCES products(sku) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL DEFAULT 'otros',
    origin VARCHAR(255),
    nutrition JSONB, -- Contiene calories, carbohydrates, protein, fat, fiber
    allergens TEXT[], -- Arreglo de alérgenos
    tags TEXT[], -- Etiquetas
    packaging_info TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0
);

-- 4. Tabla de Órdenes (Ventas generales)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closure_id UUID REFERENCES cash_closures(id) ON DELETE SET NULL
);

-- 5. Tabla de Ítems de la Orden (Detalle de Venta)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0), -- decimal para peso en Kg
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0), -- precio histórico de venta
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla de Analíticas de Pedidos Web (Anteriormente en MongoDB)
CREATE TABLE IF NOT EXISTS web_orders_analytics (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    user_agent TEXT,
    ip_address VARCHAR(50),
    items JSONB -- Detalle opcional en formato JSON
);

-- 7. Tabla para Contenido Dinámico de la Página Web (Banner, Textos, Imágenes)
CREATE TABLE IF NOT EXISTS web_page_content (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nota: Para habilitar el Tiempo Real (Realtime) de Supabase en estas tablas, 
-- se recomienda hacerlo visualmente desde tu panel de Supabase:
-- Base de Datos (Database) > Publications > supabase_realtime > Editar y seleccionar las tablas.

-- Semilla de datos iniciales en tabla "products"
INSERT INTO products (id, sku, name, sell_type, price, stock, description, image_url) VALUES
('4a945d8b-cb61-4c6e-82b5-e656e18f2d01', 'GRA-001', 'Nueces Mariposa Peladas', 'weight', 12000.00, 25.500, 'Nueces mariposa seleccionadas, frescas y crujientes.', 'nuts'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d02', 'GRA-002', 'Almendras Enteras Nonpareil', 'weight', 14000.00, 18.250, 'Almendras naturales de calibre gigante.', 'almonds'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d03', 'GRA-003', 'Castañas de Cajú Tostadas', 'weight', 16500.00, 10.800, 'Castañas de cajú sin sal, tostadas al horno.', 'cashews'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d04', 'GRA-004', 'Semillas de Zapallo', 'weight', 8900.00, 30.000, 'Semillas de zapallo peladas listas para consumo.', 'pumpkin-seeds'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d05', 'GRA-005', 'Harina de Avena Integral', 'weight', 3500.00, 45.000, 'Avena integral molida ultra fina.', 'oat-flour'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d06', 'ENV-001', 'Aceite de Coco Orgánico 500ml', 'unit', 7990.00, 15.000, 'Aceite de coco extra virgen prensado en frío.', 'coconut-oil'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d07', 'ENV-002', 'Miel de Abeja Pura 1kg', 'unit', 9500.00, 8.000, 'Miel artesanal del sur de Chile, 100% natural.', 'honey'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d08', 'ENV-003', 'Crema de Maní Natural 400g', 'unit', 4890.00, 22.000, 'Crema de maní pura, sin azúcar añadida.', 'peanut-butter'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d09', 'ENV-004', 'Té Verde Matcha Orgánico 100g', 'unit', 11990.00, 12.000, 'Matcha japonés de grado ceremonial.', 'matcha'),
('4a945d8b-cb61-4c6e-82b5-e656e18f2d10', 'ENV-005', 'Chips de Banana Deshidratada 250g', 'unit', 3200.00, 35.000, 'Crujientes rodajas de banana deshidratada.', 'banana-chips')
ON CONFLICT (sku) DO NOTHING;

-- Semilla de datos iniciales en tabla "product_details" (Atributos de Ecommerce)
INSERT INTO product_details (sku, category, origin, nutrition, allergens, tags, packaging_info, rating, reviews_count) VALUES
('GRA-001', 'nueces', 'Valle del Maipo, Chile', '{"calories": 654, "carbohydrates": 14, "protein": 15, "fat": 65, "fiber": 7}', '{"nueces"}', '{"Premium", "Sin Sal", "Energía", "Keto"}', 'Bolsa kraft compostable con zipper de sellado hermético.', 4.8, 34),
('GRA-002', 'almendras', 'Región Metropolitana, Chile', '{"calories": 579, "carbohydrates": 22, "protein": 21, "fat": 49, "fiber": 12}', '{"almendras"}', '{"Natural", "Calcio", "Snack", "Fibra"}', 'Bolsa kraft compostable hermética.', 4.9, 48),
('GRA-003', 'anacardos', 'Nordeste de Brasil', '{"calories": 553, "carbohydrates": 30, "protein": 18, "fat": 44, "fiber": 3}', '{"anacardos"}', '{"Tostado", "Minerales", "Cremoso"}', 'Empaque de papel reciclable con ventana bio-degradable.', 4.7, 29),
('GRA-004', 'semillas', 'Región del Biobío, Chile', '{"calories": 559, "carbohydrates": 10, "protein": 30, "fat": 49, "fiber": 6}', '{}', '{"Zinc", "Superalimento", "Ensaladas"}', 'Envase kraft resellable.', 4.6, 18),
('GRA-005', 'harinas', 'Región de la Araucanía, Chile', '{"calories": 379, "carbohydrates": 66, "protein": 13, "fat": 7, "fiber": 10}', '{"gluten (trazas)"}', '{"Desayuno", "Repostería", "Saludable"}', 'Saco de papel ecológico de alta resistencia.', 4.5, 22),
('ENV-001', 'aceites', 'Sri Lanka', '{"calories": 862, "carbohydrates": 0, "protein": 0, "fat": 100, "fiber": 0}', '{}', '{"Orgánico", "Prensado en Frío", "Keto", "Vegano"}', 'Frasco de vidrio ámbar reciclable con tapa sellada.', 4.9, 56),
('ENV-002', 'endulzantes', 'Frutillar, Chile', '{"calories": 304, "carbohydrates": 82, "protein": 0.3, "fat": 0, "fiber": 0}', '{}', '{"Artesanal", "100% Pura", "Endulzante Natural"}', 'Frasco de vidrio premium reutilizable con sello de cera.', 5.0, 73),
('ENV-003', 'almendras', 'Región de Valparaíso, Chile', '{"calories": 588, "carbohydrates": 20, "protein": 25, "fat": 50, "fiber": 8}', '{"maní"}', '{"Sin Azúcar", "Proteico", "Untable"}', 'Pote de vidrio hermético de boca ancha.', 4.8, 41),
('ENV-004', 'endulzantes', 'Uji, Kyoto, Japón', '{"calories": 320, "carbohydrates": 38, "protein": 30, "fat": 5, "fiber": 28}', '{}', '{"Ceremonial", "Antioxidantes", "Calma", "Concentración"}', 'Lata metálica hermética con sello protector de frescura.', 4.9, 38),
('ENV-005', 'deshidratados', 'Ecuador', '{"calories": 519, "carbohydrates": 58, "protein": 2.3, "fat": 33, "fiber": 7.7}', '{}', '{"Crujiente", "Snack Niño", "Potasio"}', 'Bolsa metalizada hermética resellable.', 4.4, 15)
ON CONFLICT (sku) DO NOTHING;

-- Semilla de contenido dinámico inicial para la web
INSERT INTO web_page_content (key, value) VALUES
('hero', '{
  "title": "Alimentación pura e inteligente para tu día.",
  "subtitle": "Descubre nuestra variedad de frutos secos a granel y productos envasados orgánicos. 100% natural, sin aditivos, seleccionados a mano para garantizar frescura y calidad superior.",
  "badge": "Calidad de Selección Premium",
  "button_primary_text": "Ver Catálogo",
  "button_secondary_text": "Ver Nueces Peladas",
  "image_url": ""
}'),
('shipping', '{
  "title": "Despacho Rápido",
  "subtitle": "Envío gratuito en Santiago por compras superiores a $25.000. Despachos en 24-48 horas."
}'),
('natural_origin', '{
  "title": "Origen Natural",
  "subtitle": "Productos libres de aditivos artificiales, pesticidas y preservantes químicos. 100% natural."
}'),
('secure_shopping', '{
  "title": "Compra Segura",
  "subtitle": "Stock y ventas sincronizadas en tiempo real con nuestra tienda física y POS de administración."
}')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS en las tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_orders_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_page_content ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen para evitar errores al re-ejecutar el script
DROP POLICY IF EXISTS "Permitir todo a productos" ON products;
DROP POLICY IF EXISTS "Permitir todo a product_details" ON product_details;
DROP POLICY IF EXISTS "Permitir todo a orders" ON orders;
DROP POLICY IF EXISTS "Permitir todo a order_items" ON order_items;
DROP POLICY IF EXISTS "Permitir todo a cash_closures" ON cash_closures;
DROP POLICY IF EXISTS "Permitir todo a web_orders_analytics" ON web_orders_analytics;
DROP POLICY IF EXISTS "Permitir todo a web_page_content" ON web_page_content;

-- Crear políticas para permitir operaciones públicas en ambiente de prueba (anon y authenticated)
CREATE POLICY "Permitir todo a productos" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a product_details" ON product_details FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a cash_closures" ON cash_closures FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a web_orders_analytics" ON web_orders_analytics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a web_page_content" ON web_page_content FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


