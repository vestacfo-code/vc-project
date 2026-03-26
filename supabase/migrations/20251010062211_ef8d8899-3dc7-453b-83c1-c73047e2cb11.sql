-- Add policy to allow admins and super admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'hr_staff')
);