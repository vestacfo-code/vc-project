-- Fix RLS policies for admin access to job applications
DROP POLICY IF EXISTS "job_applications_admin_all" ON job_applications;

CREATE POLICY "job_applications_admin_select" 
ON job_applications 
FOR SELECT 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
);

CREATE POLICY "job_applications_admin_update" 
ON job_applications 
FOR UPDATE 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
)
WITH CHECK (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
);

-- Ensure blog posts have proper admin policies
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON blog_posts;

CREATE POLICY "Admin can manage all blog posts" 
ON blog_posts 
FOR ALL 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
)
WITH CHECK (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
);