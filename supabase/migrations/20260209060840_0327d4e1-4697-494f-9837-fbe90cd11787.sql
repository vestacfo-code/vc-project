-- Add cogs column to pricing_products table to separate COGS from selling price
ALTER TABLE public.pricing_products 
ADD COLUMN cogs numeric DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.pricing_products.cogs IS 'Cost of Goods Sold - distinct from base_cost which is the selling price';