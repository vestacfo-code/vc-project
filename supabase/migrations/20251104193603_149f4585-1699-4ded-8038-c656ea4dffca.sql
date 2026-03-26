-- Create user_roles system to replace hardcoded email-based admin checks
-- This addresses critical security findings: hardcoded_admin_emails and job_applications_public_exposure

-- Create app_role enum if it doesn't exist (idempotent)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'hr_staff', 'super_admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles table
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- Migrate existing hardcoded admin users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE u.email IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'support@joinfinlo.ai'
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix job_applications RLS policies - Remove overly permissive SELECT policies
DROP POLICY IF EXISTS "Admins can view all job applications" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_admin_select" ON public.job_applications;

-- Create secure admin-only SELECT policy using has_role function
CREATE POLICY "Admins can view all job applications"
ON public.job_applications FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'hr_staff'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (auth.role() = 'service_role'::text)
);

-- Update admin UPDATE policy to use role checks
DROP POLICY IF EXISTS "Admins can update job applications" ON public.job_applications;
CREATE POLICY "Admins can update job applications"
ON public.job_applications FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'hr_staff'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (auth.role() = 'service_role'::text)
);

-- Fix shared_conversations token enumeration issue
DROP POLICY IF EXISTS "Public can view with valid token" ON public.shared_conversations;

-- Create a security definer function to validate token access
CREATE OR REPLACE FUNCTION public.can_access_shared_conversation(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_conversations
    WHERE share_token = p_token
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Note: Application code should call can_access_shared_conversation() with the token
-- rather than allowing enumeration via SELECT. The RLS policy for public access
-- should be removed or restricted to only allow access when a valid token is provided
-- through the application layer, not through direct database queries.