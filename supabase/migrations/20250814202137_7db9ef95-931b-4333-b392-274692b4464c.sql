-- Create enum for team roles
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_team_role(p_user_id UUID, p_team_id UUID)
RETURNS team_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
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
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role IN ('admin', 'owner')
  );
$$;

-- RLS Policies for teams table
CREATE POLICY "Users can view teams they belong to" 
ON public.teams FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own teams" 
ON public.teams FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update their teams" 
ON public.teams FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" 
ON public.teams FOR DELETE 
USING (owner_id = auth.uid());

-- RLS Policies for team_members table
CREATE POLICY "Users can view team members of teams they belong to" 
ON public.team_members FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team admins can add members" 
ON public.team_members FOR INSERT 
WITH CHECK (
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

CREATE POLICY "Team admins can update member roles" 
ON public.team_members FOR UPDATE 
USING (
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

CREATE POLICY "Team admins and members can remove themselves" 
ON public.team_members FOR DELETE 
USING (
  user_id = auth.uid() OR 
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

-- RLS Policies for team_invitations table
CREATE POLICY "Users can view invitations for teams they manage" 
ON public.team_invitations FOR SELECT 
USING (
  invited_by = auth.uid() OR
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

CREATE POLICY "Team admins can create invitations" 
ON public.team_invitations FOR INSERT 
WITH CHECK (
  invited_by = auth.uid() AND
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

CREATE POLICY "Team admins can update invitations" 
ON public.team_invitations FOR UPDATE 
USING (
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

CREATE POLICY "Team admins can delete invitations" 
ON public.team_invitations FOR DELETE 
USING (
  public.is_team_admin_or_owner(auth.uid(), team_id)
);

-- Create function to automatically create team owner membership
CREATE OR REPLACE FUNCTION public.create_team_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Create trigger for team owner membership
CREATE TRIGGER create_team_owner_membership_trigger
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.create_team_owner_membership();

-- Create function to check collaborator limits
CREATE OR REPLACE FUNCTION public.check_collaborator_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to enforce collaborator limits
CREATE TRIGGER enforce_collaborator_limit_trigger
  BEFORE INSERT ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_collaborator_limit();

-- Add updated_at trigger for teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();