-- Update the RLS policy to use the correct admin email
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;

CREATE POLICY "Admin can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'support@joinfinlo.ai')
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'support@joinfinlo.ai');