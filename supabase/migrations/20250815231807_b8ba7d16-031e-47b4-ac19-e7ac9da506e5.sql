-- Create table to track credit add-on subscriptions
CREATE TABLE public.credit_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  credits_per_month INTEGER NOT NULL DEFAULT 200,
  monthly_cost INTEGER NOT NULL DEFAULT 2500, -- $25.00 in cents
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_addons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own credit addons" 
ON public.credit_addons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit addons" 
ON public.credit_addons 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_credit_addons_updated_at
BEFORE UPDATE ON public.credit_addons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();