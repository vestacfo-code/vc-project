-- Add is_free column to consumer_invite_links for free custom solutions
ALTER TABLE consumer_invite_links ADD COLUMN is_free BOOLEAN DEFAULT false;

-- Add credit_renewal_day to profiles for tracking when credits reset (day of month)
ALTER TABLE profiles ADD COLUMN credit_renewal_day INTEGER DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_credit_renewal ON profiles(credit_renewal_day) WHERE credit_renewal_day IS NOT NULL;