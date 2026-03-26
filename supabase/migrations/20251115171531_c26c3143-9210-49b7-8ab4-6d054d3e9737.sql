-- Step 1: Update the initialize_user_credits function to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
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
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Credits already exist, that's fine
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to initialize credits for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.initialize_user_credits() OWNER TO postgres;

-- Step 2: Ensure unique constraint exists on user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_credits_user_id_key'
  ) THEN
    ALTER TABLE user_credits ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Step 3: Fix RLS policy
DROP POLICY IF EXISTS "Service role can manage user credits" ON user_credits;
DROP POLICY IF EXISTS "credit_usage_service_role_all" ON user_credits;

CREATE POLICY "Service role and authenticated users can manage credits"
ON user_credits
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR 
  (auth.jwt()->>'role') = 'service_role'
)
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.jwt()->>'role') = 'service_role'
);

-- Step 4: Backfill missing credits
INSERT INTO user_credits (
  user_id,
  current_credits,
  monthly_limit,
  daily_limit,
  tier,
  max_monthly_downloads,
  max_collaborators,
  credits_used_this_month,
  credits_used_today,
  report_downloads_this_month
)
SELECT 
  p.user_id,
  30,
  30,
  5,
  'founder'::subscription_tier_type,
  5,
  0,
  0,
  0,
  0
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits uc WHERE uc.user_id = p.user_id
);