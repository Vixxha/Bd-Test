-- Esquema SQL para la base de datos de Venta POS (Supabase / PostgreSQL)

-- 1. Tabla de Cierres de Caja Diarios
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

-- 2. Tabla de Productos (soporta Granel por peso y Envasados por unidad)
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

-- 3. Tabla de Órdenes (Ventas)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closure_id UUID REFERENCES cash_closures(id) ON DELETE SET NULL
);

-- 4. Tabla de Ítems de la Orden (Detalle de Venta)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0), -- decimal para peso en Kg
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0), -- precio histórico de venta
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar tiempo real (Realtime) en las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_closures;

-- Semilla de datos iniciales (Frutos secos a granel y productos envasados)
INSERT INTO products (sku, name, sell_type, price, stock, description, image_url) VALUES
('GRA-001', 'Nueces Mariposa Peladas', 'weight', 12000.00, 25.500, 'Nueces mariposa seleccionadas, frescas y crujientes.', 'nuts'),
('GRA-002', 'Almendras Enteras Nonpareil', 'weight', 14000.00, 18.250, 'Almendras naturales de calibre gigante.', 'almonds'),
('GRA-003', 'Castañas de Cajú Tostadas', 'weight', 16500.00, 10.800, 'Castañas de cajú sin sal, tostadas al horno.', 'cashews'),
('GRA-004', 'Semillas de Zapallo', 'weight', 8900.00, 30.000, 'Semillas de zapallo peladas listas para consumo.', 'pumpkin-seeds'),
('GRA-005', 'Harina de Avena Integral', 'weight', 3500.00, 45.000, 'Avena integral molida ultra fina.', 'oat-flour'),
('ENV-001', 'Aceite de Coco Orgánico 500ml', 'unit', 7990.00, 15.000, 'Aceite de coco extra virgen prensado en frío.', 'coconut-oil'),
('ENV-002', 'Miel de Abeja Pura 1kg', 'unit', 9500.00, 8.000, 'Miel artesanal del sur de Chile, 100% natural.', 'honey'),
('ENV-003', 'Crema de Maní Natural 400g', 'unit', 4890.00, 22.000, 'Crema de maní pura, sin azúcar añadida.', 'peanut-butter'),
('ENV-004', 'Té Verde Matcha Orgánico 100g', 'unit', 11990.00, 12.000, 'Matcha japonés de grado ceremonial.', 'matcha'),
('ENV-005', 'Chips de Banana Deshidratada 250g', 'unit', 3200.00, 35.000, 'Crujientes rodajas de banana deshidratada.', 'banana-chips')
ON CONFLICT (sku) DO NOTHING;
