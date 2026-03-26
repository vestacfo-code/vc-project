-- Fix monthly-only credit reset (no daily additions)
-- Paid users: reset on billing period (credit_renewal_day from profile)
-- Free users: reset on account creation anniversary (tier_start_date)

-- Remove daily credit addition - only track daily usage for analytics
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only reset the daily usage counter, don't add credits
  UPDATE user_credits 
  SET 
    credits_used_today = 0,
    last_daily_reset = CURRENT_DATE
  WHERE last_daily_reset < CURRENT_DATE;
END;
$function$;

-- Fix monthly reset to use credit_renewal_day from profiles for paid users
-- and tier_start_date anniversary for free users
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset credits for users based on their renewal cycle
  UPDATE user_credits uc
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
    -- Reset to full monthly allowance (base + addons)
    current_credits = CASE 
      WHEN uc.monthly_limit >= 999999 THEN 999999
      ELSE uc.monthly_limit + COALESCE((
        SELECT SUM(credits_per_month) 
        FROM credit_addons 
        WHERE credit_addons.user_id = uc.user_id 
        AND status = 'active'
      ), 0)
    END
  FROM profiles p
  WHERE uc.user_id = p.user_id
    AND uc.last_reset_date < CURRENT_DATE
    AND (
      -- For paid users with credit_renewal_day set: reset on that day of month
      (p.credit_renewal_day IS NOT NULL AND EXTRACT(DAY FROM CURRENT_DATE) = p.credit_renewal_day)
      OR
      -- For free users (no renewal day): reset on tier_start_date anniversary
      (p.credit_renewal_day IS NULL AND EXTRACT(DAY FROM uc.tier_start_date) = EXTRACT(DAY FROM CURRENT_DATE)
       AND uc.last_reset_date < (CURRENT_DATE - INTERVAL '25 days'))
    );
    
  -- Log the reset
  RAISE NOTICE 'Monthly credits reset completed at %', now();
END;
$function$;