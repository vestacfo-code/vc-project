-- Fix search path security warnings for functions
CREATE OR REPLACE FUNCTION public.get_user_team_role(p_user_id UUID, p_team_id UUID)
RETURNS team_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role 
  FROM public.team_members 
  WHERE user_id = p_user_id AND team_id = p_team_id;
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role IN ('admin', 'owner')
  );
$$;

CREATE OR REPLACE FUNCTION public.create_team_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_collaborator_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  team_owner_id UUID;
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get team owner
  SELECT owner_id INTO team_owner_id 
  FROM public.teams 
  WHERE id = NEW.team_id;
  
  -- Get current collaborator count (excluding owner)
  SELECT COUNT(*) INTO current_count 
  FROM public.team_members 
  WHERE team_id = NEW.team_id AND role != 'owner';
  
  -- Get max allowed collaborators for the team owner
  SELECT max_collaborators INTO max_allowed 
  FROM public.user_credits 
  WHERE user_id = team_owner_id;
  
  -- Check if adding this member would exceed the limit
  IF current_count >= max_allowed AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Collaborator limit exceeded. Maximum allowed: %', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$;