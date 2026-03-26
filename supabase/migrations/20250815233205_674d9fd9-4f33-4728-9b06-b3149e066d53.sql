-- Enable realtime for user_credits table
ALTER TABLE public.user_credits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;

-- Enable realtime for credit_addons table  
ALTER TABLE public.credit_addons REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_addons;