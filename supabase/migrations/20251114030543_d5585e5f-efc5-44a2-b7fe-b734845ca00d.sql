-- Fix RLS policy on admin_permissions to allow inserts
DROP POLICY IF EXISTS "Super admins can manage all permissions" ON public.admin_permissions;

CREATE POLICY "Super admins can manage all permissions"
ON public.admin_permissions
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));