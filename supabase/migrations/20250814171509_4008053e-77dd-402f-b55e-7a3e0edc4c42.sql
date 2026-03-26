-- Create unlimited credits for founder access users
-- Update the founder tier to have unlimited credits for founder@joinfinlo.ai users

-- First, let's create a special function to handle unlimited credits
CREATE OR REPLACE FUNCTION public.grant_unlimited_credits(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user by email (either in subscribers table or auth.users)
  SELECT user_id INTO target_user_id 
  FROM subscribers 
  WHERE email = p_email;
  
  -- If not found in subscribers, try to find in auth.users via profiles
  IF target_user_id IS NULL THEN
    SELECT user_id INTO target_user_id
    FROM profiles 
    WHERE email = p_email;
  END IF;
  
  -- If still not found, try to get from auth.users directly through profiles
  IF target_user_id IS NULL THEN
    SELECT u.id INTO target_user_id
    FROM auth.users u
    WHERE u.email = p_email;
  END IF;
  
  -- If user found, update their credits to unlimited
  IF target_user_id IS NOT NULL THEN
    -- Update or insert unlimited credits
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
      999999, -- Very high number for unlimited
      999999, -- Unlimited monthly
      999999, -- Unlimited daily
      'founder', 
      -1, -- Unlimited downloads
      999, -- High collaborator limit
      0, 
      0
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      current_credits = 999999,
      monthly_limit = 999999,
      daily_limit = 999999,
      tier = 'founder',
      max_monthly_downloads = -1,
      max_collaborators = 999,
      updated_at = now();
      
    -- Also update subscribers table if exists
    INSERT INTO subscribers (
      email,
      user_id,
      subscription_tier,
      subscribed
    ) VALUES (
      p_email,
      target_user_id,
      'Founder Access',
      true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      subscription_tier = 'Founder Access',
      subscribed = true,
      updated_at = now();
      
  END IF;
END;
$function$;

-- Grant unlimited credits to the founder access user
SELECT public.grant_unlimited_credits('founder@joinfinlo.ai');

-- Update the credit manager to handle unlimited credits
CREATE OR REPLACE FUNCTION public.is_unlimited_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM user_credits 
    WHERE user_id = p_user_id 
    AND monthly_limit >= 999999
  ) OR EXISTS (
    SELECT 1 
    FROM subscribers 
    WHERE user_id = p_user_id 
    AND email = 'founder@joinfinlo.ai'
  );
$function$;

-- Update the reset functions to handle unlimited users
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset credits for regular users
  UPDATE user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
    current_credits = CASE 
      WHEN monthly_limit >= 999999 THEN 999999 -- Keep unlimited users unlimited
      ELSE monthly_limit -- Give full monthly allocation for regular users
    END
  WHERE last_reset_date < date_trunc('month', CURRENT_DATE);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_today = 0,
    last_daily_reset = CURRENT_DATE,
    -- Only add daily credits if not at monthly limit and not unlimited
    current_credits = CASE
      WHEN monthly_limit >= 999999 THEN 999999 -- Keep unlimited users unlimited
      ELSE LEAST(
        current_credits + daily_limit, 
        monthly_limit - credits_used_this_month + daily_limit
      )
    END
  WHERE last_daily_reset < CURRENT_DATE;
END;
$function$;