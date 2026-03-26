-- Fix RLS policy for welcome_links to allow admin users to insert
DROP POLICY IF EXISTS "Admin can manage welcome links" ON welcome_links;

CREATE POLICY "Admin can manage welcome links" 
ON welcome_links 
FOR ALL 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
  OR (status = 'active'::text)
)
WITH CHECK (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['finlo.hq@gmail.com'::text, 'founder@joinfinlo.ai'::text])) 
  OR (auth.role() = 'service_role'::text)
);