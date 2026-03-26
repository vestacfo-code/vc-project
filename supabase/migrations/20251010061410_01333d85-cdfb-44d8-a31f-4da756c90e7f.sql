-- Update RLS policies for user_roles table to only allow super_admins to manage roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

CREATE POLICY "Super admins can manage all roles" ON user_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins and HR staff can view roles" ON user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'hr_staff')
);

-- Set support@joinfinlo.ai as super_admin
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user_id from profiles
  SELECT user_id INTO target_user_id
  FROM profiles
  WHERE email = 'support@joinfinlo.ai';
  
  IF target_user_id IS NOT NULL THEN
    -- Delete any existing roles for this user
    DELETE FROM user_roles WHERE user_id = target_user_id;
    
    -- Insert super_admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin');
  END IF;
END $$;