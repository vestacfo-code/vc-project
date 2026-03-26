-- Enable realtime for financial_data table
ALTER TABLE public.financial_data REPLICA IDENTITY FULL;

-- Add financial_data table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_data;