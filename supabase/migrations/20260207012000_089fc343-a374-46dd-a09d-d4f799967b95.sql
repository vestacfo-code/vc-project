-- Add skip_integration_onboarding to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skip_integration_onboarding BOOLEAN DEFAULT false;

-- Add skip_integration_onboarding to consumer_invite_links
ALTER TABLE consumer_invite_links ADD COLUMN IF NOT EXISTS skip_integration_onboarding BOOLEAN DEFAULT false;

-- Create pricing_products table - central SKU registry
CREATE TABLE pricing_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upc TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  product_type TEXT,
  size TEXT,
  gender TEXT,
  base_cost DECIMAL(12,2),
  target_margin DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, upc)
);

-- Create pricing_suppliers table - supplier configurations
CREATE TABLE pricing_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  column_mapping JSONB,
  last_updated TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pricing_supplier_prices table - multi-supplier price records
CREATE TABLE pricing_supplier_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES pricing_products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES pricing_suppliers(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  country TEXT,
  availability INTEGER,
  min_order_qty INTEGER,
  price_type TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, supplier_id, country, effective_date)
);

-- Enable RLS on all pricing tables
ALTER TABLE pricing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_supplier_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies for pricing_products
CREATE POLICY "Users can manage their own pricing products"
ON pricing_products FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for pricing_suppliers
CREATE POLICY "Users can manage their own pricing suppliers"
ON pricing_suppliers FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for pricing_supplier_prices
CREATE POLICY "Users can view their own supplier prices"
ON pricing_supplier_prices FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pricing_products pp
    WHERE pp.id = pricing_supplier_prices.product_id
    AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own supplier prices"
ON pricing_supplier_prices FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pricing_products pp
    WHERE pp.id = pricing_supplier_prices.product_id
    AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own supplier prices"
ON pricing_supplier_prices FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pricing_products pp
    WHERE pp.id = pricing_supplier_prices.product_id
    AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own supplier prices"
ON pricing_supplier_prices FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pricing_products pp
    WHERE pp.id = pricing_supplier_prices.product_id
    AND pp.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_pricing_products_user_id ON pricing_products(user_id);
CREATE INDEX idx_pricing_products_upc ON pricing_products(upc);
CREATE INDEX idx_pricing_products_brand ON pricing_products(brand);
CREATE INDEX idx_pricing_suppliers_user_id ON pricing_suppliers(user_id);
CREATE INDEX idx_pricing_supplier_prices_product_id ON pricing_supplier_prices(product_id);
CREATE INDEX idx_pricing_supplier_prices_supplier_id ON pricing_supplier_prices(supplier_id);
CREATE INDEX idx_pricing_supplier_prices_effective_date ON pricing_supplier_prices(effective_date);