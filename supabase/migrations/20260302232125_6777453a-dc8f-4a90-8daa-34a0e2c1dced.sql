
-- Allow all authenticated users to SELECT from pricing_products (shared catalog)
CREATE POLICY "Authenticated users can view all pricing products"
ON public.pricing_products
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to SELECT from pricing_suppliers (shared catalog)
CREATE POLICY "Authenticated users can view all active pricing suppliers"
ON public.pricing_suppliers
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to SELECT from pricing_ai_recommendations (shared catalog)
CREATE POLICY "Authenticated users can view all pricing recommendations"
ON public.pricing_ai_recommendations
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to SELECT from pricing_supplier_prices (needed for joins)
CREATE POLICY "Authenticated users can view all supplier prices"
ON public.pricing_supplier_prices
FOR SELECT
TO authenticated
USING (true);
