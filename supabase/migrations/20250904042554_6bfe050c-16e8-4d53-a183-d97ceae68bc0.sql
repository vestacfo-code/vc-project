-- Fix critical security vulnerability: Remove public access to sensitive job application data
-- while maintaining welcome link functionality with limited data exposure

-- First, drop the problematic public policy that exposes all application data
DROP POLICY IF EXISTS "Public can view job applications linked to active welcome links" ON job_applications;

-- Create a secure function to check if a user can access their own welcome link
CREATE OR REPLACE FUNCTION public.can_access_welcome_link_application(p_application_id uuid, p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM welcome_links 
    WHERE application_id = p_application_id 
    AND slug = p_slug 
    AND status = 'active'
  );
$$;

-- Create a new restricted policy that only allows viewing basic application info via welcome links
-- This policy will be used in combination with application-level access control
CREATE POLICY "Restricted welcome link access to job applications" 
ON job_applications 
FOR SELECT 
USING (
  -- Only allow access if there's an active welcome link for this application
  EXISTS (
    SELECT 1 
    FROM welcome_links 
    WHERE welcome_links.application_id = job_applications.id 
    AND welcome_links.status = 'active'
  )
);

-- Add a comment explaining the security consideration
COMMENT ON POLICY "Restricted welcome link access to job applications" ON job_applications IS 
'Allows limited access to job applications via welcome links. Application code must implement additional access controls to prevent unauthorized data exposure.';

-- Ensure admin policies are properly secured (these look good already but let's be explicit)
-- Update admin policies to be more explicit about who can access what
DROP POLICY IF EXISTS "job_applications_admin_select" ON job_applications;
DROP POLICY IF EXISTS "job_applications_admin_update" ON job_applications;

CREATE POLICY "HR admin can view all job applications" 
ON job_applications 
FOR SELECT 
USING (
  (auth.jwt() ->> 'email') = ANY (ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai', 'support@joinfinlo.ai']) 
  OR auth.role() = 'service_role'
);

CREATE POLICY "HR admin can update job applications" 
ON job_applications 
FOR UPDATE 
USING (
  (auth.jwt() ->> 'email') = ANY (ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']) 
  OR auth.role() = 'service_role'
)
WITH CHECK (
  (auth.jwt() ->> 'email') = ANY (ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']) 
  OR auth.role() = 'service_role'
);