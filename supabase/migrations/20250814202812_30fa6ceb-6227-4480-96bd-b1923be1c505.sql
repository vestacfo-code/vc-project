-- Fix infinite recursion in team policies by simplifying team access
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view teams they own or are members of" ON teams;
DROP POLICY IF EXISTS "Users can update teams they own" ON teams;
DROP POLICY IF EXISTS "Users can delete teams they own" ON teams;
DROP POLICY IF EXISTS "Team owners can insert teams" ON teams;

-- Create simplified team policies that don't cause recursion
CREATE POLICY "Users can view teams they own" 
ON teams FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view teams they are members of" 
ON teams FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.team_id = teams.id 
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams" 
ON teams FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update teams" 
ON teams FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete teams" 
ON teams FOR DELETE 
USING (auth.uid() = owner_id);