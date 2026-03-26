-- Update job_applications RLS policies to allow better admin access
-- First, drop existing admin policies to avoid conflicts
DROP POLICY IF EXISTS "job_applications_admin_select" ON job_applications;
DROP POLICY IF EXISTS "job_applications_admin_update" ON job_applications;
DROP POLICY IF EXISTS "job_applications_admin_delete" ON job_applications;

-- Create improved admin policies that work for both authenticated and service role access
CREATE POLICY "job_applications_admin_all" ON job_applications
FOR ALL 
USING (
  -- Allow access if user is authenticated with admin email OR if it's service role
  (auth.jwt() ->> 'email' = ANY(ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']))
  OR 
  (auth.role() = 'service_role')
)
WITH CHECK (
  (auth.jwt() ->> 'email' = ANY(ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']))
  OR 
  (auth.role() = 'service_role')
);

-- Also ensure job_roles table allows admin access for reading
CREATE POLICY "job_roles_admin_select" ON job_roles
FOR SELECT 
USING (
  (auth.jwt() ->> 'email' = ANY(ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']))
  OR 
  (auth.role() = 'service_role')
  OR 
  (is_active = true) -- Keep public access to active roles
);