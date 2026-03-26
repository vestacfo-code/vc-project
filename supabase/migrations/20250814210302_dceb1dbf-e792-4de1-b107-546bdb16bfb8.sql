-- Update existing roles to match new system
UPDATE team_members SET role = 'super_admin' WHERE role = 'owner';
UPDATE team_members SET role = 'collaborator' WHERE role = 'member';
UPDATE team_invitations SET role = 'collaborator' WHERE role = 'member';

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

-- Update the role check functions
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

-- Add constraint function to prevent unauthorized super_admin role changes
CREATE OR REPLACE FUNCTION public.check_super_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent changing super_admin role unless done by super_admin
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