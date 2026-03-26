-- Create subscription tiers enum
CREATE TYPE subscription_tier_type AS ENUM ('founder', 'scale', 'ceo');

-- Create credits table for tracking user credits
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_credits INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 30,
  daily_limit INTEGER NOT NULL DEFAULT 5,
  credits_used_today INTEGER NOT NULL DEFAULT 0,
  credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_daily_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  tier subscription_tier_type NOT NULL DEFAULT 'founder',
  tier_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  additional_credits_purchased INTEGER NOT NULL DEFAULT 0,
  report_downloads_this_month INTEGER NOT NULL DEFAULT 0,
  max_monthly_downloads INTEGER NOT NULL DEFAULT 5,
  max_collaborators INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit usage log table
CREATE TABLE public.credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'ai_response', 'generate_insights', 'report_download'
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Create subscription changes log
CREATE TABLE public.subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_tier subscription_tier_type,
  new_tier subscription_tier_type NOT NULL,
  change_reason TEXT,
  stripe_subscription_id TEXT,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON public.user_credits
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits" ON public.user_credits
FOR ALL USING (true);

-- RLS policies for credit_usage_log
CREATE POLICY "Users can view their own usage log" ON public.credit_usage_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage log" ON public.credit_usage_log
FOR ALL USING (true);

-- RLS policies for subscription_changes
CREATE POLICY "Users can view their own subscription changes" ON public.subscription_changes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription changes" ON public.subscription_changes
FOR ALL USING (true);

-- Function to initialize user credits when they sign up
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize credits for new users
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_credits();

-- Function to reset daily credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used_today = 0,
    last_daily_reset = CURRENT_DATE,
    current_credits = LEAST(current_credits + daily_limit, monthly_limit - credits_used_this_month)
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tier settings
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID,
  p_new_tier subscription_tier_type,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;