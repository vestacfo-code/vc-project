-- Update has_permission function to include staff role
-- Staff users should have broad access like admins
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission admin_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Super admins and staff have all permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'staff')
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
  );
$$;

-- Update has_any_permission function similarly
CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permissions admin_permission[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Super admins and staff have all permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'staff')
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = ANY(_permissions)
  );
$$;

-- Update staff_records policy to include staff role
DROP POLICY IF EXISTS "Admins can manage staff records" ON public.staff_records;
CREATE POLICY "Admins can manage staff records"
ON public.staff_records
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'hr_staff') 
  OR has_role(auth.uid(), 'staff')
  OR has_role(auth.uid(), 'super_admin')
  OR auth.role() = 'service_role'
);