-- Fix credit reset functions and audit existing credits

-- 1. Improve reset_monthly_credits function
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
    -- Reset to full monthly allowance (base + addons)
    current_credits = CASE 
      WHEN monthly_limit >= 999999 THEN 999999
      ELSE monthly_limit + COALESCE((
        SELECT SUM(credits_per_month) 
        FROM credit_addons 
        WHERE credit_addons.user_id = user_credits.user_id 
        AND status = 'active'
      ), 0)
    END
  WHERE 
    -- Check if it's time to reset based on tier_start_date
    CURRENT_DATE >= (
      DATE_TRUNC('month', tier_start_date) + 
      (EXTRACT(DAY FROM tier_start_date) - 1) * INTERVAL '1 day' +
      INTERVAL '1 month'
    )
    AND last_reset_date < CURRENT_DATE;
    
  -- Log the reset
  RAISE NOTICE 'Monthly credits reset completed at %', now();
END;
$function$;

-- 2. Improve reset_daily_credits function
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
    -- Add daily allowance, but don't exceed total monthly limit
    current_credits = CASE
      WHEN monthly_limit >= 999999 THEN 999999
      ELSE LEAST(
        current_credits + daily_limit,
        monthly_limit + COALESCE((
          SELECT SUM(credits_per_month) 
          FROM credit_addons 
          WHERE credit_addons.user_id = user_credits.user_id 
          AND status = 'active'
        ), 0)
      )
    END
  WHERE last_daily_reset < CURRENT_DATE;
  
  -- Log the reset
  RAISE NOTICE 'Daily credits reset completed at %', now();
END;
$function$;

-- 3. Create audit function to fix incorrect credit values
CREATE OR REPLACE FUNCTION public.audit_and_fix_user_credits()
RETURNS TABLE(
  user_id uuid,
  old_credits integer,
  new_credits integer,
  tier subscription_tier_type,
  action_taken text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH credit_audit AS (
    SELECT 
      uc.user_id,
      uc.current_credits as old_credits,
      uc.tier,
      uc.monthly_limit,
      COALESCE((
        SELECT SUM(ca.credits_per_month) 
        FROM credit_addons ca 
        WHERE ca.user_id = uc.user_id 
        AND ca.status = 'active'
      ), 0) as addon_credits,
      -- Calculate what credits should be
      CASE 
        WHEN uc.monthly_limit >= 999999 THEN 999999
        ELSE LEAST(
          uc.monthly_limit + COALESCE((
            SELECT SUM(ca.credits_per_month) 
            FROM credit_addons ca 
            WHERE ca.user_id = uc.user_id 
            AND ca.status = 'active'
          ), 0),
          uc.monthly_limit + COALESCE((
            SELECT SUM(ca.credits_per_month) 
            FROM credit_addons ca 
            WHERE ca.user_id = uc.user_id 
            AND ca.status = 'active'
          ), 0) - uc.credits_used_this_month
        )
      END as calculated_credits
    FROM user_credits uc
  ),
  updates AS (
    UPDATE user_credits uc
    SET 
      current_credits = ca.calculated_credits,
      updated_at = now()
    FROM credit_audit ca
    WHERE uc.user_id = ca.user_id
    AND uc.current_credits != ca.calculated_credits
    RETURNING 
      uc.user_id,
      ca.old_credits,
      uc.current_credits as new_credits,
      uc.tier,
      'Credits adjusted to match tier + addons - used credits' as action_taken
  )
  SELECT * FROM updates;
END;
$function$;

-- 4. Fix any users with incorrect tier limits
UPDATE user_credits 
SET 
  monthly_limit = 30,
  daily_limit = 5,
  max_monthly_downloads = 5,
  max_collaborators = 0
WHERE tier = 'founder' 
AND (monthly_limit != 30 OR daily_limit != 5);

UPDATE user_credits 
SET 
  monthly_limit = 150,
  daily_limit = 30,
  max_monthly_downloads = 25,
  max_collaborators = 2
WHERE tier = 'scale' 
AND (monthly_limit != 150 OR daily_limit != 30);

UPDATE user_credits 
SET 
  monthly_limit = 250,
  daily_limit = 50,
  max_monthly_downloads = -1,
  max_collaborators = 6
WHERE tier = 'ceo' 
AND (monthly_limit != 250 OR daily_limit != 50);

-- 5. Run the audit to fix current_credits for all users
SELECT * FROM audit_and_fix_user_credits();