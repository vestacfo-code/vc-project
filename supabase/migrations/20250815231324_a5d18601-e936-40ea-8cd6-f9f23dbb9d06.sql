-- Add function to get next reset date based on account creation
CREATE OR REPLACE FUNCTION public.get_next_monthly_reset_date(p_user_id uuid)
RETURNS date
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_tier_start_date timestamp with time zone;
  current_month_start date;
  next_reset_date date;
BEGIN
  -- Get the user's tier start date
  SELECT tier_start_date INTO user_tier_start_date
  FROM user_credits 
  WHERE user_id = p_user_id;
  
  IF user_tier_start_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate the day of month from tier start date
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::date + 
                        (EXTRACT(DAY FROM user_tier_start_date) - 1) * INTERVAL '1 day';
  
  -- If we haven't reached this month's reset date, return it
  -- Otherwise, return next month's reset date
  IF CURRENT_DATE < current_month_start THEN
    next_reset_date := current_month_start;
  ELSE
    next_reset_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date + 
                      (EXTRACT(DAY FROM user_tier_start_date) - 1) * INTERVAL '1 day';
  END IF;
  
  RETURN next_reset_date;
END;
$function$