-- Fix security warnings by setting search_path for functions

-- Update initialize_user_credits function with proper search_path
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (
    user_id,
    current_credits,
    monthly_limit,
    daily_limit,
    tier,
    max_monthly_downloads,
    max_collaborators
  ) VALUES (
    NEW.id,
    5, -- Start with 5 credits for founder tier
    30, -- 30 monthly limit for founder
    5,  -- 5 daily limit for founder
    'founder',
    5,  -- 5 report downloads for founder
    0   -- No collaborators for founder
  );
  RETURN NEW;
END;
$$;

-- Update reset_daily_credits function with proper search_path
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used_today = 0,
    last_daily_reset = CURRENT_DATE,
    current_credits = LEAST(current_credits + daily_limit, monthly_limit - credits_used_this_month)
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$;

-- Update reset_monthly_credits function with proper search_path
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
    current_credits = daily_limit
  WHERE last_reset_date < date_trunc('month', CURRENT_DATE);
END;
$$;

-- Update update_user_tier function with proper search_path
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID,
  p_new_tier subscription_tier_type,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  v_old_tier subscription_tier_type;
  v_monthly_limit INTEGER;
  v_daily_limit INTEGER;
  v_max_downloads INTEGER;
  v_max_collaborators INTEGER;
BEGIN
  -- Get current tier
  SELECT tier INTO v_old_tier FROM public.user_credits WHERE user_id = p_user_id;
  
  -- Set limits based on tier
  CASE p_new_tier
    WHEN 'founder' THEN
      v_monthly_limit := 30;
      v_daily_limit := 5;
      v_max_downloads := 5;
      v_max_collaborators := 0;
    WHEN 'scale' THEN
      v_monthly_limit := 100;
      v_daily_limit := 20;
      v_max_downloads := 25;
      v_max_collaborators := 2;
    WHEN 'ceo' THEN
      v_monthly_limit := 250;
      v_daily_limit := 50;
      v_max_downloads := -1; -- Unlimited
      v_max_collaborators := 6;
  END CASE;
  
  -- Update user credits
  UPDATE public.user_credits 
  SET 
    tier = p_new_tier,
    monthly_limit = v_monthly_limit,
    daily_limit = v_daily_limit,
    max_monthly_downloads = v_max_downloads,
    max_collaborators = v_max_collaborators,
    tier_start_date = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log the subscription change
  INSERT INTO public.subscription_changes (
    user_id,
    old_tier,
    new_tier,
    stripe_subscription_id,
    change_reason
  ) VALUES (
    p_user_id,
    v_old_tier,
    p_new_tier,
    p_stripe_subscription_id,
    'Tier upgrade/downgrade'
  );
END;
$$;