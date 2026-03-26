-- Fix the initialize_user_credits function to handle missing cases
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
  -- Check if user has a subscription
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
  
  -- Use the subscription tier if found, otherwise default to founder
  IF subscription_info.tier_enum IS NOT NULL THEN
    user_tier := subscription_info.tier_enum;
  END IF;
  
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
    ELSE
      -- Default case to prevent errors
      user_credits_val := 30;
      monthly_val := 30;
      daily_val := 5;
      downloads_val := 5;
      collaborators_val := 0;
  END CASE;

  -- Insert or update user credits
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
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in initialize_user_credits: %', SQLERRM;
    RETURN NEW;
END;
$function$;