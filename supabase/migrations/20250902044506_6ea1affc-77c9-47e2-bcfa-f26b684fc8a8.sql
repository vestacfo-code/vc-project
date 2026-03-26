-- Update RLS policy to allow admin access by email for job applications
DROP POLICY IF EXISTS "job_applications_admin_select" ON job_applications;

CREATE POLICY "job_applications_admin_select" 
ON job_applications 
FOR SELECT 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text, 'support@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
);

-- Also ensure job roles are accessible to admin
DROP POLICY IF EXISTS "job_roles_admin_select" ON job_roles;

CREATE POLICY "job_roles_admin_select" 
ON job_roles 
FOR SELECT 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text, 'support@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
  OR (is_active = true)
);