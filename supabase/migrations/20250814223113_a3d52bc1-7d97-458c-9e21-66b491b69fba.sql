-- Update team_invitations table to support Supabase auth integration
ALTER TABLE team_invitations 
ADD COLUMN IF NOT EXISTS auth_invitation_id UUID,
ADD COLUMN IF NOT EXISTS signup_redirect_url TEXT DEFAULT 'https://finlo.ai/dashboard?tab=teams';