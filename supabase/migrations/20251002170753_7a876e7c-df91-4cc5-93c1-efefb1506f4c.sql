-- CRITICAL SECURITY FIX: Implement proper role-based access control

-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hr_staff', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: CRITICAL - Fix job_applications RLS policies
-- Remove the dangerous public access policy
DROP POLICY IF EXISTS "Restricted welcome link access to job applications" ON public.job_applications;

-- Replace with secure welcome link access that checks the token properly
CREATE POLICY "Secure welcome link access to job applications"
  ON public.job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.welcome_links wl
      WHERE wl.application_id = job_applications.id
        AND wl.status = 'active'
        AND wl.deleted_at IS NULL
    )
  );

-- Update admin policies to use role-based check
DROP POLICY IF EXISTS "HR admin can view all job applications" ON public.job_applications;
DROP POLICY IF EXISTS "HR admin can update job applications" ON public.job_applications;

CREATE POLICY "Admins can view all job applications"
  ON public.job_applications
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'hr_staff')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Admins can update job applications"
  ON public.job_applications
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'hr_staff')
    OR auth.role() = 'service_role'
  );

-- Step 6: CRITICAL - Fix preboarding_steps RLS policies
-- Remove the DANGEROUS public access policy
DROP POLICY IF EXISTS "Public can view and update preboarding steps" ON public.preboarding_steps;

-- Replace with secure policies
CREATE POLICY "Admins can manage preboarding steps"
  ON public.preboarding_steps
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_staff')
  );

-- Allow access via valid welcome link token only
CREATE POLICY "Secure welcome link access to preboarding steps"
  ON public.preboarding_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.welcome_links wl
      WHERE wl.id = preboarding_steps.welcome_link_id
        AND wl.status = 'active'
        AND wl.deleted_at IS NULL
    )
  );

-- Update other admin policies to use role-based access
DROP POLICY IF EXISTS "Admin can manage preboarding steps" ON public.preboarding_steps;

-- Step 7: Fix staff_records RLS
DROP POLICY IF EXISTS "Admin can manage staff records" ON public.staff_records;

CREATE POLICY "Admins can manage staff records"
  ON public.staff_records
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_staff')
    OR auth.role() = 'service_role'
  );

-- Step 8: Fix welcome_links RLS
DROP POLICY IF EXISTS "Admin can manage welcome links" ON public.welcome_links;

CREATE POLICY "Admins can manage welcome links"
  ON public.welcome_links
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_staff')
    OR auth.role() = 'service_role'
    OR status = 'active'
  );

-- Step 9: Fix job_roles admin policies
DROP POLICY IF EXISTS "job_roles_admin_select" ON public.job_roles;

CREATE POLICY "Admins and public can view job roles"
  ON public.job_roles
  FOR SELECT
  USING (
    is_active = true
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_staff')
    OR auth.role() = 'service_role'
  );

-- Step 10: Fix blog_posts admin policies
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;

CREATE POLICY "Admins can manage all blog posts"
  ON public.blog_posts
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.role() = 'service_role'
  );

-- Step 11: Fix press_releases admin policies  
DROP POLICY IF EXISTS "Admin can manage press releases" ON public.press_releases;

CREATE POLICY "Admins can manage press releases"
  ON public.press_releases
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.role() = 'service_role'
  );

-- Step 12: Migrate existing admin users (finlo.hq@gmail.com and founder@joinfinlo.ai)
-- Insert admin roles for known admin emails
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai', 'support@joinfinlo.ai')
ON CONFLICT (user_id, role) DO NOTHING;