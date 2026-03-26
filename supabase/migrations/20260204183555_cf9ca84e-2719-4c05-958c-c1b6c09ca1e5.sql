-- Add payment status to profiles for tracking custom solution payment completion
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT NULL;

-- Add monthly credits to invite links for admin-configured credit amounts
ALTER TABLE consumer_invite_links ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT NULL;

-- Create index for faster lookups on payment status
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status) WHERE payment_status IS NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN profiles.payment_status IS 'Payment status for custom solution users: pending or completed. NULL for regular users.';
COMMENT ON COLUMN consumer_invite_links.monthly_credits IS 'Custom monthly credit limit. NULL = use tier defaults, -1 = unlimited (999999).';