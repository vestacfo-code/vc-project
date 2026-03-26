-- Fix infinite recursion in team_members RLS policies
-- Create security definer function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_user_team_member(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id
  );
$function$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view team members of teams they belong to" ON public.team_members;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view team members of teams they belong to"
ON public.team_members
FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  is_user_team_member(auth.uid(), team_id)
);