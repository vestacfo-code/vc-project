-- Fix RLS policies to include 'staff' role for data visibility

-- Update crm_call_scripts policy to include staff
DROP POLICY IF EXISTS "Admins can manage call scripts" ON crm_call_scripts;
CREATE POLICY "Admins can manage call scripts"
ON crm_call_scripts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'hr_staff', 'super_admin', 'staff')
  )
);

-- Update job_roles policy to include staff
DROP POLICY IF EXISTS "Admins and public can view job roles" ON job_roles;
CREATE POLICY "Admins and public can view job roles"
ON job_roles
FOR SELECT
TO public
USING (
  is_active = true 
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'hr_staff')
  OR has_role(auth.uid(), 'staff')
  OR has_role(auth.uid(), 'super_admin')
  OR auth.role() = 'service_role'
);

-- Update preboarding_steps policy to include staff
DROP POLICY IF EXISTS "Admins can manage preboarding steps" ON preboarding_steps;
CREATE POLICY "Admins can manage preboarding steps"
ON preboarding_steps
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'hr_staff')
  OR has_role(auth.uid(), 'staff')
  OR has_role(auth.uid(), 'super_admin')
);

-- Update profiles policy to include staff
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'super_admin')
  OR has_role(auth.uid(), 'hr_staff')
  OR has_role(auth.uid(), 'staff')
);