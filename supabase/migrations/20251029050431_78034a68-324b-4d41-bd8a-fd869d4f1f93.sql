-- Fix reset_monthly_credits to include add-on credits in the monthly reset
-- This ensures users get their base credits + add-on credits each month

CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
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
    CURRENT_DATE >= (
      DATE_TRUNC('month', tier_start_date) + 
      (EXTRACT(DAY FROM tier_start_date) - 1) * INTERVAL '1 day' +
      INTERVAL '1 month'
    )
    AND last_reset_date < CURRENT_DATE;
END;
$function$;