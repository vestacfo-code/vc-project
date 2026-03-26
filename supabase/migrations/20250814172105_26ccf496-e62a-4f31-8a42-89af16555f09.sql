-- Remove unlimited credits from regular founder plan users
-- Only give unlimited credits to users who used the discount code "founder@joinfinlo.ai"

-- First, reset all founder plan users back to normal limits
UPDATE user_credits 
SET 
  current_credits = 30,
  monthly_limit = 30,
  daily_limit = 5,
  max_monthly_downloads = 5,
  max_collaborators = 0,
  updated_at = now()
WHERE tier = 'founder' AND monthly_limit >= 999999;

-- Create a discount codes table to track special access
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  benefits jsonb DEFAULT '{}',
  used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on discount codes table
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for discount codes
CREATE POLICY "Users can view their own discount codes" 
ON public.discount_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage discount codes" 
ON public.discount_codes 
FOR ALL 
USING (true);

-- Insert the special founder discount code
INSERT INTO public.discount_codes (code, email, benefits) 
VALUES (
  'founder@joinfinlo.ai', 
  'founder@joinfinlo.ai',
  '{"unlimited_credits": true, "unlimited_downloads": true, "unlimited_collaborators": true}'
) ON CONFLICT (code) DO NOTHING;

-- Update the unlimited credits function to be more specific
CREATE OR REPLACE FUNCTION public.grant_unlimited_credits(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT user_id INTO target_user_id 
  FROM subscribers 
  WHERE email = p_email;
  
  IF target_user_id IS NULL THEN
    SELECT user_id INTO target_user_id
    FROM profiles 
    WHERE email = p_email;
  END IF;
  
  IF target_user_id IS NULL THEN
    SELECT u.id INTO target_user_id
    FROM auth.users u
    WHERE u.email = p_email;
  END IF;
  
  -- Only grant unlimited if user exists and matches the special founder email
  IF target_user_id IS NOT NULL AND p_email = 'founder@joinfinlo.ai' THEN
    -- Update user credits to unlimited
    INSERT INTO user_credits (
      user_id, 
      current_credits, 
      monthly_limit, 
      daily_limit,
      tier, 
      max_monthly_downloads, 
      max_collaborators,
      credits_used_this_month, 
      credits_used_today
    ) VALUES (
      target_user_id, 
      999999,
      999999,
      999999,
      'founder', 
      -1,
      999,
      0, 
      0
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      current_credits = 999999,
      monthly_limit = 999999,
      daily_limit = 999999,
      max_monthly_downloads = -1,
      max_collaborators = 999,
      updated_at = now();
      
    -- Record the discount code usage
    INSERT INTO discount_codes (code, user_id, email, benefits)
    VALUES (
      'founder@joinfinlo.ai',
      target_user_id,
      p_email,
      '{"unlimited_credits": true, "unlimited_downloads": true, "unlimited_collaborators": true}'
    )
    ON CONFLICT (code) 
    DO UPDATE SET
      user_id = target_user_id,
      email = p_email,
      used_at = now();
  END IF;
END;
$function$;

-- Update the unlimited user check to be more specific
CREATE OR REPLACE FUNCTION public.is_unlimited_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM discount_codes dc
    WHERE dc.user_id = p_user_id 
    AND dc.code = 'founder@joinfinlo.ai'
    AND dc.benefits->>'unlimited_credits' = 'true'
  );
$function$;

-- Re-grant unlimited credits only to the specific founder email
SELECT public.grant_unlimited_credits('founder@joinfinlo.ai');

-- Update subscription tier enum to include CFO (keeping CEO for backward compatibility)
-- Note: We'll handle the display change in the frontend, keeping the database enum as is for now