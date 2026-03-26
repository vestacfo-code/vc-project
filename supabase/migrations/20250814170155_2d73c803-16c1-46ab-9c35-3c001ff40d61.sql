-- First, let's add the trigger for new users to get credits automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_credits();

-- Create a function to ensure all existing users have credit records
CREATE OR REPLACE FUNCTION ensure_user_credits_exist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  subscription_tier_val subscription_tier_type;
BEGIN
  -- Loop through all users who don't have credit records
  FOR user_record IN 
    SELECT u.id, COALESCE(s.subscription_tier, 'founder') as tier
    FROM auth.users u
    LEFT JOIN user_credits uc ON u.id = uc.user_id
    LEFT JOIN subscribers s ON u.id = s.user_id OR u.email = s.email
    WHERE uc.user_id IS NULL
  LOOP
    -- Convert the tier string to the enum type, defaulting to founder
    CASE user_record.tier
      WHEN 'Founder Access' THEN subscription_tier_val := 'founder';
      WHEN 'Scale' THEN subscription_tier_val := 'scale';
      WHEN 'CEO' THEN subscription_tier_val := 'ceo';
      ELSE subscription_tier_val := 'founder';
    END CASE;

    -- Insert credit record based on subscription tier
    CASE subscription_tier_val
      WHEN 'founder' THEN
        INSERT INTO user_credits (
          user_id, current_credits, monthly_limit, daily_limit, 
          tier, max_monthly_downloads, max_collaborators
        ) VALUES (
          user_record.id, 30, 30, 5, 'founder', 5, 0
        );
      WHEN 'scale' THEN
        INSERT INTO user_credits (
          user_id, current_credits, monthly_limit, daily_limit, 
          tier, max_monthly_downloads, max_collaborators
        ) VALUES (
          user_record.id, 100, 100, 20, 'scale', 25, 2
        );
      WHEN 'ceo' THEN
        INSERT INTO user_credits (
          user_id, current_credits, monthly_limit, daily_limit, 
          tier, max_monthly_downloads, max_collaborators
        ) VALUES (
          user_record.id, 250, 250, 50, 'ceo', -1, 6
        );
    END CASE;
  END LOOP;
END;
$$;

-- Execute the function to create credit records for existing users
SELECT ensure_user_credits_exist();

-- Update the initialization function to give users their full monthly allocation
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tier subscription_tier_type := 'founder';
  user_credits_val integer := 30;
  monthly_val integer := 30;
  daily_val integer := 5;
  downloads_val integer := 5;
  collaborators_val integer := 0;
BEGIN
  -- Check if user has a subscription
  SELECT 
    CASE 
      WHEN subscription_tier = 'Founder Access' THEN 'founder'::subscription_tier_type
      WHEN subscription_tier = 'Scale' THEN 'scale'::subscription_tier_type  
      WHEN subscription_tier = 'CEO' THEN 'ceo'::subscription_tier_type
      ELSE 'founder'::subscription_tier_type
    END
  INTO user_tier
  FROM subscribers 
  WHERE user_id = NEW.id OR email = NEW.email;
  
  -- Set limits based on tier
  CASE user_tier
    WHEN 'founder' THEN
      user_credits_val := 30;
      monthly_val := 30;
      daily_val := 5;
      downloads_val := 5;
      collaborators_val := 0;
    WHEN 'scale' THEN
      user_credits_val := 100;
      monthly_val := 100;
      daily_val := 20;
      downloads_val := 25;
      collaborators_val := 2;
    WHEN 'ceo' THEN
      user_credits_val := 250;
      monthly_val := 250;
      daily_val := 50;
      downloads_val := -1; -- Unlimited
      collaborators_val := 6;
  END CASE;

  INSERT INTO user_credits (
    user_id,
    current_credits,
    monthly_limit,
    daily_limit,
    tier,
    max_monthly_downloads,
    max_collaborators
  ) VALUES (
    NEW.id,
    user_credits_val,
    monthly_val,
    daily_val,
    user_tier,
    downloads_val,
    collaborators_val
  );
  
  RETURN NEW;
END;
$$;

-- Update the tier update function to properly allocate credits
CREATE OR REPLACE FUNCTION update_user_tier(p_user_id uuid, p_new_tier subscription_tier_type, p_stripe_subscription_id text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_tier subscription_tier_type;
  v_monthly_limit INTEGER;
  v_daily_limit INTEGER;
  v_max_downloads INTEGER;
  v_max_collaborators INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Get current tier
  SELECT tier INTO v_old_tier FROM user_credits WHERE user_id = p_user_id;
  
  -- Set limits and credits based on tier
  CASE p_new_tier
    WHEN 'founder' THEN
      v_monthly_limit := 30;
      v_daily_limit := 5;
      v_max_downloads := 5;
      v_max_collaborators := 0;
      v_new_credits := 30; -- Give full monthly allocation
    WHEN 'scale' THEN
      v_monthly_limit := 100;
      v_daily_limit := 20;
      v_max_downloads := 25;
      v_max_collaborators := 2;
      v_new_credits := 100; -- Give full monthly allocation
    WHEN 'ceo' THEN
      v_monthly_limit := 250;
      v_daily_limit := 50;
      v_max_downloads := -1; -- Unlimited
      v_max_collaborators := 6;
      v_new_credits := 250; -- Give full monthly allocation
  END CASE;
  
  -- Update user credits with new tier and full credit allocation
  UPDATE user_credits 
  SET 
    tier = p_new_tier,
    monthly_limit = v_monthly_limit,
    daily_limit = v_daily_limit,
    max_monthly_downloads = v_max_downloads,
    max_collaborators = v_max_collaborators,
    current_credits = v_new_credits,
    credits_used_this_month = 0, -- Reset usage when upgrading
    credits_used_today = 0,
    tier_start_date = now(),
    last_reset_date = date_trunc('month', now()),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (
      user_id, current_credits, monthly_limit, daily_limit,
      tier, max_monthly_downloads, max_collaborators,
      credits_used_this_month, credits_used_today
    ) VALUES (
      p_user_id, v_new_credits, v_monthly_limit, v_daily_limit,
      p_new_tier, v_max_downloads, v_max_collaborators, 0, 0
    );
  END IF;
  
  -- Log the subscription change
  INSERT INTO subscription_changes (
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
    'Tier upgrade/downgrade with full credit allocation'
  );
END;
$$;

-- Improve the monthly reset function to give users their full monthly allocation
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
    current_credits = monthly_limit -- Give full monthly allocation
  WHERE last_reset_date < date_trunc('month', CURRENT_DATE);
END;
$$;

-- Improve the daily reset function 
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_today = 0,
    last_daily_reset = CURRENT_DATE,
    -- Only add daily credits if not at monthly limit
    current_credits = LEAST(
      current_credits + daily_limit, 
      monthly_limit - credits_used_this_month + daily_limit
    )
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$;