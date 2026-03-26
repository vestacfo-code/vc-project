-- Create a secure function to accept team invitations
-- This bypasses RLS since new users can't add themselves to teams
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_new_member_id UUID;
BEGIN
  -- Get the user's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get the invitation
  SELECT * INTO v_invitation
  FROM team_invitations
  WHERE id = p_invitation_id
    AND accepted_at IS NULL;
  
  IF v_invitation IS NULL THEN
    -- Try to find by email instead (invitation might have been created before user existed)
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE LOWER(email) = LOWER(v_user_email)
      AND accepted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or already accepted');
  END IF;
  
  -- Verify email matches (case-insensitive)
  IF LOWER(v_invitation.email) != LOWER(v_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email does not match invitation');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = v_invitation.team_id 
      AND user_id = p_user_id
  ) THEN
    -- Already a member, just mark invitation as accepted
    UPDATE team_invitations
    SET accepted_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Already a team member');
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_invitation.team_id, p_user_id, v_invitation.role)
  RETURNING id INTO v_new_member_id;
  
  -- Mark invitation as accepted
  UPDATE team_invitations
  SET accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'member_id', v_new_member_id,
    'team_id', v_invitation.team_id,
    'role', v_invitation.role
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(UUID, UUID) TO authenticated;