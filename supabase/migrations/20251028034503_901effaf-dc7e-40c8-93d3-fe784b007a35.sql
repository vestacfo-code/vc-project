-- Create referral codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '90 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can view codes they created (only once)
CREATE POLICY "Users can view codes they created"
ON public.referral_codes
FOR SELECT
USING (auth.uid() = created_by_user_id);

-- Anyone can view active unused codes for validation
CREATE POLICY "Public can validate referral codes"
ON public.referral_codes
FOR SELECT
USING (is_active = true AND used_by_user_id IS NULL AND expires_at > now());

-- Service role can manage all codes
CREATE POLICY "Service role can manage codes"
ON public.referral_codes
FOR ALL
USING (auth.role() = 'service_role');

-- Add trial tracking columns to user_credits
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_code_used TEXT;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to activate referral and generate new codes
CREATE OR REPLACE FUNCTION public.activate_referral_code(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, new_codes TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id UUID;
  v_new_codes TEXT[] := ARRAY[]::TEXT[];
  v_i INTEGER;
BEGIN
  -- Check if code is valid and unused
  SELECT id INTO v_code_id
  FROM referral_codes
  WHERE code = p_code
    AND is_active = true
    AND used_by_user_id IS NULL
    AND expires_at > now();
  
  IF v_code_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired referral code', ARRAY[]::TEXT[];
    RETURN;
  END IF;
  
  -- Mark code as used
  UPDATE referral_codes
  SET used_by_user_id = p_user_id,
      used_at = now(),
      is_active = false
  WHERE id = v_code_id;
  
  -- Update user credits with trial
  UPDATE user_credits
  SET trial_start_date = now(),
      trial_end_date = now() + interval '14 days',
      is_trial_active = true,
      referral_code_used = p_code,
      tier = 'ceo',
      current_credits = 250,
      monthly_limit = 250,
      daily_limit = 50,
      max_monthly_downloads = -1,
      max_collaborators = 6
  WHERE user_id = p_user_id;
  
  -- Generate 4 new referral codes for the user
  FOR v_i IN 1..4 LOOP
    DECLARE
      v_new_code TEXT;
    BEGIN
      v_new_code := generate_referral_code();
      v_new_codes := array_append(v_new_codes, v_new_code);
      
      INSERT INTO referral_codes (code, created_by_user_id)
      VALUES (v_new_code, p_user_id);
    END;
  END LOOP;
  
  RETURN QUERY SELECT true, 'Referral code activated successfully', v_new_codes;
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_used_by ON public.referral_codes(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_created_by ON public.referral_codes(created_by_user_id);