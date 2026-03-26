-- Revert has_permission to only grant full access to super_admin
-- Staff should have customizable granular permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission admin_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only super admins have all permissions automatically
  -- Staff and others need specific permissions granted
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
  );
$$;

-- Revert has_any_permission similarly
CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permissions admin_permission[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only super admins have all permissions automatically
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = ANY(_permissions)
  );
$$;