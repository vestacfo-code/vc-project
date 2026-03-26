-- Create table to track all AI interactions
CREATE TABLE IF NOT EXISTS public.ai_interaction_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  model_used text,
  tokens_used integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.ai_interaction_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own interaction logs"
  ON public.ai_interaction_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert logs
CREATE POLICY "Service role can insert interaction logs"
  ON public.ai_interaction_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_ai_interaction_log_user_id ON public.ai_interaction_log(user_id);
CREATE INDEX idx_ai_interaction_log_created_at ON public.ai_interaction_log(created_at DESC);

-- Drop and recreate get_public_stats with only users and revenue
DROP FUNCTION IF EXISTS public.get_public_stats();

CREATE FUNCTION public.get_public_stats()
RETURNS TABLE(total_users bigint, total_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COALESCE(SUM(revenue), 0) FROM public.financial_data) as total_revenue;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO authenticated;