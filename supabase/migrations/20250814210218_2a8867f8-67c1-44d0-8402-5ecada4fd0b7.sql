-- Update team_role enum to match the new role system
-- First, add the new role if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role' AND typcategory = 'E') THEN
        CREATE TYPE team_role AS ENUM ('super_admin', 'admin', 'collaborator', 'viewer');
    ELSE
        -- Check if we need to add new values
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role')) THEN
            ALTER TYPE team_role ADD VALUE 'super_admin';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'collaborator' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'team_role')) THEN
            ALTER TYPE team_role ADD VALUE 'collaborator';
        END IF;
    END IF;
END $$;

-- Update existing 'owner' roles to 'super_admin' and 'member' to 'collaborator'
UPDATE team_members SET role = 'super_admin' WHERE role = 'owner';
UPDATE team_members SET role = 'collaborator' WHERE role = 'member';
UPDATE team_invitations SET role = 'collaborator' WHERE role = 'member';

-- Add shareable_token column to teams for shareable links
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shareable_token uuid DEFAULT gen_random_uuid();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shareable_enabled boolean DEFAULT false;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_teams_shareable_token ON teams(shareable_token) WHERE shareable_enabled = true;

-- Update the team creation trigger to ensure super_admin role
CREATE OR REPLACE FUNCTION public.create_team_super_admin_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'super_admin');
  RETURN NEW;
END;
$function$;

-- Update the role check function to handle super_admin restrictions
CREATE OR REPLACE FUNCTION public.is_team_super_admin(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role = 'super_admin'
  );
$function$;

-- Update the admin check function
CREATE OR REPLACE FUNCTION public.is_team_admin_or_super_admin(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role IN ('super_admin', 'admin')
  );
$function$;

-- Add RLS policy for shareable links
CREATE POLICY "Public access to teams via shareable token" 
ON public.teams 
FOR SELECT 
USING (shareable_enabled = true AND shareable_token IS NOT NULL);

-- Update existing policies to use new function names
DROP POLICY IF EXISTS "Team admins can create invitations" ON team_invitations;
CREATE POLICY "Team admins can create invitations" 
ON public.team_invitations 
FOR INSERT 
WITH CHECK ((invited_by = auth.uid()) AND is_team_admin_or_super_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can delete invitations" ON team_invitations;
CREATE POLICY "Team admins can delete invitations" 
ON public.team_invitations 
FOR DELETE 
USING (is_team_admin_or_super_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can update invitations" ON team_invitations;
CREATE POLICY "Team admins can update invitations" 
ON public.team_invitations 
FOR UPDATE 
USING (is_team_admin_or_super_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Users can view invitations for teams they manage" ON team_invitations;
CREATE POLICY "Users can view invitations for teams they manage" 
ON public.team_invitations 
FOR SELECT 
USING ((invited_by = auth.uid()) OR is_team_admin_or_super_admin(auth.uid(), team_id));

-- Update team member policies
DROP POLICY IF EXISTS "Team admins and members can remove themselves" ON team_members;
CREATE POLICY "Team admins and members can remove themselves" 
ON public.team_members 
FOR DELETE 
USING ((user_id = auth.uid()) OR is_team_admin_or_super_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can add members" ON team_members;
CREATE POLICY "Team admins can add members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (is_team_admin_or_super_admin(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can update member roles" ON team_members;
CREATE POLICY "Team admins can update member roles" 
ON public.team_members 
FOR UPDATE 
USING (is_team_admin_or_super_admin(auth.uid(), team_id));

-- Add constraint to prevent super_admin role changes (except by super_admin)
CREATE OR REPLACE FUNCTION public.check_super_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent changing super_admin role unless done by super_admin or system
  IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    IF NOT is_team_super_admin(auth.uid(), NEW.team_id) THEN
      RAISE EXCEPTION 'Only Super Admin can change Super Admin role';
    END IF;
  END IF;
  
  -- Prevent assigning super_admin role to anyone except team owner
  IF NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    IF NOT EXISTS (SELECT 1 FROM teams WHERE id = NEW.team_id AND owner_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Super Admin role can only be assigned to team owner';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role change validation
DROP TRIGGER IF EXISTS validate_role_changes ON team_members;
CREATE TRIGGER validate_role_changes
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_super_admin_role_change();