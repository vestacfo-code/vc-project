-- Alter user_credits table to support fractional credits
ALTER TABLE public.user_credits 
  ALTER COLUMN current_credits TYPE NUMERIC(10,2),
  ALTER COLUMN credits_used_today TYPE NUMERIC(10,2),
  ALTER COLUMN credits_used_this_month TYPE NUMERIC(10,2),
  ALTER COLUMN monthly_limit TYPE NUMERIC(10,2),
  ALTER COLUMN daily_limit TYPE NUMERIC(10,2),
  ALTER COLUMN additional_credits_purchased TYPE NUMERIC(10,2);

-- Alter credit_usage_log to support fractional credits
ALTER TABLE public.credit_usage_log 
  ALTER COLUMN credits_used TYPE NUMERIC(10,2);

-- Alter credit_addons to support fractional credits
ALTER TABLE public.credit_addons 
  ALTER COLUMN credits_per_month TYPE NUMERIC(10,2);