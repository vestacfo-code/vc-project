-- Allow users to view invitations sent TO their email address
-- This enables the Auth.tsx to find pending invitations for the logged-in user
CREATE POLICY "Users can view invitations sent to their email"
ON public.team_invitations
FOR SELECT
USING (
  LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
);