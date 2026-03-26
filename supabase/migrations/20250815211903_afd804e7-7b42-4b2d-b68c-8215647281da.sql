-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.public_stats_summary;

-- Create a simple function to get public stats instead
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(total_users bigint, total_documents bigint, total_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.documents)::bigint as total_documents,
    (SELECT COALESCE(SUM(revenue), 0) FROM public.financial_data) as total_revenue;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO authenticated;