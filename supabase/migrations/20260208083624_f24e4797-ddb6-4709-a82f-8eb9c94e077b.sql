-- Manually add the test user to the team and mark invitation as accepted
-- This fixes the existing pending state for isidi@bcyouthcouncil.org

-- Add user to team_members
INSERT INTO team_members (team_id, user_id, role, joined_at)
VALUES (
  'a96a3d1f-a696-426f-98c5-94f2bd7d4c05',
  '7d32fba7-3b63-4c6e-ad1d-c8154e15a358',
  'member',
  NOW()
);

-- Mark the invitation as accepted
UPDATE team_invitations 
SET accepted_at = NOW()
WHERE id = '73d47622-1b87-4943-84b6-880c7be2b325';