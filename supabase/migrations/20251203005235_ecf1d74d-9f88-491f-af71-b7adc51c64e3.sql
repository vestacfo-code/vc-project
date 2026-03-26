-- Update has_any_permission() to read from admin_permissions table
CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permissions admin_permission[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Super admins have all permissions automatically
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = _user_id AND permission::admin_permission = ANY(_permissions)
  );
$$;

-- Update has_permission() to read from admin_permissions table
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission admin_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Super admins have all permissions automatically
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = _user_id AND permission::admin_permission = _permission
  );
$$;