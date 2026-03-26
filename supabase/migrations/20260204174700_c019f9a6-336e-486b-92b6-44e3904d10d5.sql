-- Add pricing columns to consumer_invite_links table
ALTER TABLE public.consumer_invite_links 
ADD COLUMN IF NOT EXISTS fixed_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pricing_description TEXT;