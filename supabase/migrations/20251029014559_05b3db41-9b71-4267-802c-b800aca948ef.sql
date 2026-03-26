-- Update credit amounts for Scale tier (100 → 150)

-- Update the update_user_tier function to reflect new credit amounts
CREATE OR REPLACE FUNCTION public.update_user_tier(p_user_id uuid, p_new_tier subscription_tier_type, p_stripe_subscription_id text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_tier subscription_tier_type;
  v_monthly_limit INTEGER;
  v_daily_limit INTEGER;
  v_max_downloads INTEGER;
  v_max_collaborators INTEGER;
  v_new_credits INTEGER;
BEGIN
  SELECT tier INTO v_old_tier FROM user_credits WHERE user_id = p_user_id;
  
  CASE p_new_tier
    WHEN 'founder' THEN
      v_monthly_limit := 30;
      v_daily_limit := 5;
      v_max_downloads := 5;
      v_max_collaborators := 0;
      v_new_credits := 30;
    WHEN 'scale' THEN
      v_monthly_limit := 150;
      v_daily_limit := 30;
      v_max_downloads := 25;
      v_max_collaborators := 2;
      v_new_credits := 150;
    WHEN 'ceo' THEN
      v_monthly_limit := 250;
      v_daily_limit := 50;
      v_max_downloads := -1;
      v_max_collaborators := 6;
      v_new_credits := 250;
  END CASE;
  
  UPDATE user_credits 
  SET 
    tier = p_new_tier,
    monthly_limit = v_monthly_limit,
    daily_limit = v_daily_limit,
    max_monthly_downloads = v_max_downloads,
    max_collaborators = v_max_collaborators,
    current_credits = v_new_credits,
    credits_used_this_month = 0,
    credits_used_today = 0,
    tier_start_date = now(),
    last_reset_date = date_trunc('month', now()),
    updated_at = now()
  WHERE user_id = p_user_id;
  
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
$function$;

-- Update the initialize_user_credits function
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_tier subscription_tier_type := 'founder';
  user_credits_val integer := 30;
  monthly_val integer := 30;
  daily_val integer := 5;
  downloads_val integer := 5;
  collaborators_val integer := 0;
  subscription_info record;
BEGIN
  SELECT 
    CASE 
      WHEN subscription_tier = 'Founder Access' THEN 'founder'::subscription_tier_type
      WHEN subscription_tier = 'Scale' THEN 'scale'::subscription_tier_type  
      WHEN subscription_tier = 'CEO' OR subscription_tier = 'CFO' THEN 'ceo'::subscription_tier_type
      ELSE 'founder'::subscription_tier_type
    END as tier_enum
  INTO subscription_info
  FROM subscribers 
  WHERE user_id = NEW.id OR email = NEW.email
  LIMIT 1;
  
  IF subscription_info.tier_enum IS NOT NULL THEN
    user_tier := subscription_info.tier_enum;
  END IF;
  
  CASE user_tier
    WHEN 'founder' THEN
      user_credits_val := 30;
      monthly_val := 30;
      daily_val := 5;
      downloads_val := 5;
      collaborators_val := 0;
    WHEN 'scale' THEN
      user_credits_val := 150;
      monthly_val := 150;
      daily_val := 30;
      downloads_val := 25;
      collaborators_val := 2;
    WHEN 'ceo' THEN
      user_credits_val := 250;
      monthly_val := 250;
      daily_val := 50;
      downloads_val := -1;
      collaborators_val := 6;
    ELSE
      user_credits_val := 30;
      monthly_val := 30;
      daily_val := 5;
      downloads_val := 5;
      collaborators_val := 0;
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
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_credits = EXCLUDED.current_credits,
    monthly_limit = EXCLUDED.monthly_limit,
    daily_limit = EXCLUDED.daily_limit,
    tier = EXCLUDED.tier,
    max_monthly_downloads = EXCLUDED.max_monthly_downloads,
    max_collaborators = EXCLUDED.max_collaborators,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in initialize_user_credits: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update the ensure_user_credits_exist function
CREATE OR REPLACE FUNCTION public.ensure_user_credits_exist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  subscription_tier_val subscription_tier_type;
BEGIN
  FOR user_record IN 
    SELECT u.id, COALESCE(s.subscription_tier, 'founder') as tier
    FROM auth.users u
    LEFT JOIN user_credits uc ON u.id = uc.user_id
    LEFT JOIN subscribers s ON u.id = s.user_id OR u.email = s.email
    WHERE uc.user_id IS NULL
  LOOP
    CASE user_record.tier
      WHEN 'Founder Access' THEN subscription_tier_val := 'founder';
      WHEN 'Scale' THEN subscription_tier_val := 'scale';
      WHEN 'CEO' THEN subscription_tier_val := 'ceo';
      ELSE subscription_tier_val := 'founder';
    END CASE;

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
          user_record.id, 150, 150, 30, 'scale', 25, 2
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
$function$;