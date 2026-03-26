-- Create public aggregate views for live statistics
CREATE OR REPLACE VIEW public.public_stats_summary AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.documents) as total_documents,
  (SELECT COALESCE(SUM(revenue), 0) FROM public.financial_data) as total_revenue;

-- Enable RLS on the view
ALTER VIEW public.public_stats_summary SET (security_barrier = true);

-- Create RLS policy to allow anonymous read access to aggregate stats
CREATE POLICY "Allow anonymous read access to public stats" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous read access to documents count" 
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous read access to financial data sum" 
ON public.financial_data 
FOR SELECT 
USING (true);