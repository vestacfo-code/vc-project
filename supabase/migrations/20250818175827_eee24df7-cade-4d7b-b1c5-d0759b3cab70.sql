-- Remove the dangerous anonymous read access policy from financial_data table
-- This policy allows anyone to read all financial data including revenue, expenses, profit, and cash flow
DROP POLICY "Allow anonymous read access to financial data sum" ON public.financial_data;

-- The get_public_stats() function will still work because it uses SECURITY DEFINER
-- which gives it elevated privileges to aggregate revenue data without exposing individual records