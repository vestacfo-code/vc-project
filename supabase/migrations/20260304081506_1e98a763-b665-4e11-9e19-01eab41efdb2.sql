-- Create UPC alias table for mapping multiple supplier UPCs to a single canonical product
CREATE TABLE public.pricing_product_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.pricing_products(id) ON DELETE CASCADE,
  alias_upc TEXT NOT NULL,
  supplier_id UUID REFERENCES public.pricing_suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alias_upc, supplier_id)
);

-- Enable RLS
ALTER TABLE public.pricing_product_aliases ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all aliases (shared pricing data)
CREATE POLICY "Authenticated users can view aliases"
ON public.pricing_product_aliases
FOR SELECT
TO authenticated
USING (true);

-- Users can manage aliases for products they own
CREATE POLICY "Users can insert aliases"
ON public.pricing_product_aliases
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pricing_products pp
    WHERE pp.id = product_id AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update aliases"
ON public.pricing_product_aliases
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pricing_products pp
    WHERE pp.id = product_id AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete aliases"
ON public.pricing_product_aliases
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pricing_products pp
    WHERE pp.id = product_id AND pp.user_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX idx_pricing_product_aliases_upc ON public.pricing_product_aliases(alias_upc);
CREATE INDEX idx_pricing_product_aliases_product ON public.pricing_product_aliases(product_id);