-- Create enum for admin permissions
CREATE TYPE public.admin_permission AS ENUM (
  'blog_management',
  'press_management',
  'careers_management',
  'crm_contacts',
  'crm_deals',
  'crm_activities',
  'crm_call_center',
  'crm_analytics',
  'staff_directory',
  'training_management',
  'user_management',
  'audit_logs'
);

-- Create user_permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission admin_permission NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID,
  UNIQUE(user_id, permission)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission admin_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Super admins have all permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
  );
$$;

-- Create function to check if user has any of multiple permissions
CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id UUID, _permissions admin_permission[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Super admins have all permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = ANY(_permissions)
  );
$$;

-- Create function to get all user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(permission admin_permission)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If super admin, return all permissions
  SELECT unnest(enum_range(NULL::admin_permission))
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
  UNION
  -- Otherwise return granted permissions
  SELECT up.permission
  FROM public.user_permissions up
  WHERE up.user_id = _user_id;
$$;

-- RLS Policies for user_permissions table
CREATE POLICY "Super admins can manage all permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Update blog_posts RLS to use new permissions
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (
  has_permission(auth.uid(), 'blog_management') OR (auth.role() = 'service_role')
);

-- Update press_releases RLS to use new permissions
DROP POLICY IF EXISTS "Admins can manage press releases" ON public.press_releases;
CREATE POLICY "Admins can manage press releases"
ON public.press_releases
FOR ALL
TO authenticated
USING (
  has_permission(auth.uid(), 'press_management') OR (auth.role() = 'service_role')
);

-- Update job_roles RLS to use new permissions
CREATE POLICY "Admins can manage job roles"
ON public.job_roles
FOR ALL
TO authenticated
USING (
  has_permission(auth.uid(), 'careers_management') OR (auth.role() = 'service_role')
);

-- Update job_applications RLS to use new permissions
DROP POLICY IF EXISTS "Admins can view all job applications" ON public.job_applications;
CREATE POLICY "Admins can view all job applications"
ON public.job_applications
FOR SELECT
TO authenticated
USING (
  has_permission(auth.uid(), 'careers_management') OR (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Admins can update job applications" ON public.job_applications;
CREATE POLICY "Admins can update job applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (
  has_permission(auth.uid(), 'careers_management') OR (auth.role() = 'service_role')
);

-- Update CRM contacts RLS
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.crm_contacts;
CREATE POLICY "Admins can view all contacts"
ON public.crm_contacts
FOR SELECT
TO authenticated
USING (
  has_any_permission(auth.uid(), ARRAY['crm_contacts', 'crm_call_center']::admin_permission[])
);

DROP POLICY IF EXISTS "Admins can create contacts" ON public.crm_contacts;
CREATE POLICY "Admins can create contacts"
ON public.crm_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  has_any_permission(auth.uid(), ARRAY['crm_contacts', 'crm_call_center']::admin_permission[])
);

DROP POLICY IF EXISTS "Admins can update contacts" ON public.crm_contacts;
CREATE POLICY "Admins can update contacts"
ON public.crm_contacts
FOR UPDATE
TO authenticated
USING (
  has_any_permission(auth.uid(), ARRAY['crm_contacts', 'crm_call_center']::admin_permission[])
);

DROP POLICY IF EXISTS "Super admins can delete contacts" ON public.crm_contacts;
CREATE POLICY "Super admins can delete contacts"
ON public.crm_contacts
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin')
);

-- Update CRM deals RLS
DROP POLICY IF EXISTS "Admins can manage all deals" ON public.crm_deals;
CREATE POLICY "Admins can manage all deals"
ON public.crm_deals
FOR ALL
TO authenticated
USING (
  has_permission(auth.uid(), 'crm_deals')
);

-- Update CRM activities RLS
DROP POLICY IF EXISTS "Admins can manage all activities" ON public.crm_activities;
CREATE POLICY "Admins can manage all activities"
ON public.crm_activities
FOR ALL
TO authenticated
USING (
  has_permission(auth.uid(), 'crm_activities')
);

-- Update CRM call logs RLS
DROP POLICY IF EXISTS "Admins can view all call logs" ON public.crm_call_logs;
CREATE POLICY "Admins can view all call logs"
ON public.crm_call_logs
FOR SELECT
TO authenticated
USING (
  has_any_permission(auth.uid(), ARRAY['crm_call_center', 'crm_analytics']::admin_permission[])
);

DROP POLICY IF EXISTS "Admins can create call logs" ON public.crm_call_logs;
CREATE POLICY "Admins can create call logs"
ON public.crm_call_logs
FOR INSERT
TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'crm_call_center')
);

-- Update audit log RLS (super admins only)
DROP POLICY IF EXISTS "Super admins can view audit log" ON public.crm_audit_log;
CREATE POLICY "Super admins can view audit log"
ON public.crm_audit_log
FOR SELECT
TO authenticated
USING (
  has_permission(auth.uid(), 'audit_logs')
);

-- Update training materials RLS
CREATE POLICY "Admins can manage training materials"
ON public.training_materials
FOR ALL
TO authenticated
USING (
  has_permission(auth.uid(), 'training_management')
);

-- Update staff_records RLS
CREATE POLICY "Admins can view staff directory"
ON public.staff_records
FOR SELECT
TO authenticated
USING (
  has_permission(auth.uid(), 'staff_directory')
);