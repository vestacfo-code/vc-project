-- Add new enum values first
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'collaborator';

-- Add shareable_token column to teams for shareable links
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shareable_token uuid DEFAULT gen_random_uuid();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shareable_enabled boolean DEFAULT false;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_teams_shareable_token ON teams(shareable_token) WHERE shareable_enabled = true;