-- Create table to store AI pricing recommendations
CREATE TABLE public.pricing_ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.pricing_products(id) ON DELETE CASCADE,
  optimal_price NUMERIC(10, 2) NOT NULL,
  reasoning TEXT,
  strategy_used JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.pricing_ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own AI recommendations"
ON public.pricing_ai_recommendations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI recommendations"
ON public.pricing_ai_recommendations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI recommendations"
ON public.pricing_ai_recommendations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI recommendations"
ON public.pricing_ai_recommendations
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_pricing_ai_recommendations_user_product ON public.pricing_ai_recommendations(user_id, product_id);

-- Add trigger for updated_at
CREATE TRIGGER update_pricing_ai_recommendations_updated_at
BEFORE UPDATE ON public.pricing_ai_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();