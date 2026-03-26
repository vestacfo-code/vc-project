-- Update reset_monthly_credits function to use account creation date
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset credits for users whose monthly period has ended based on their tier_start_date
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
  WHERE 
    -- Check if a full month has passed since tier_start_date
    CURRENT_DATE >= (
      DATE_TRUNC('month', tier_start_date) + 
      (EXTRACT(DAY FROM tier_start_date) - 1) * INTERVAL '1 day' +
      INTERVAL '1 month'
    )
    AND last_reset_date < CURRENT_DATE;
END;
$function$