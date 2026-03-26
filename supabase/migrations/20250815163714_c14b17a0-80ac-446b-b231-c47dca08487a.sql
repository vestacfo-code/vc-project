-- Fix job applications security - restrict access to sensitive personal data
-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Anyone can submit job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Only authorized admins can view job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Service role can delete job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Service role can insert job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Service role can select job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Service role can update job applications" ON public.job_applications;

-- Create secure policies for job applications
-- 1. Allow anonymous users to submit applications only
CREATE POLICY "job_applications_anonymous_insert" 
ON public.job_applications 
FOR INSERT 
TO anon
WITH CHECK (true);

-- 2. Allow authenticated users to submit applications
CREATE POLICY "job_applications_authenticated_insert" 
ON public.job_applications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3. Only specific admin emails can view job applications
CREATE POLICY "job_applications_admin_select" 
ON public.job_applications 
FOR SELECT 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
);

-- 4. Only specific admin emails can update job applications (for status changes)
CREATE POLICY "job_applications_admin_update" 
ON public.job_applications 
FOR UPDATE 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
);

-- 5. Only specific admin emails can delete job applications
CREATE POLICY "job_applications_admin_delete" 
ON public.job_applications 
FOR DELETE 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
);

-- 6. Service role has full access for backend operations
CREATE POLICY "job_applications_service_role_all" 
ON public.job_applications 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);