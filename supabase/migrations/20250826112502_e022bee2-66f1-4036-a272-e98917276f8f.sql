-- Fix the RLS policy to use the correct way to get user email
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;

CREATE POLICY "Admin can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING ((auth.jwt() ->> 'email') = 'support@joinfinlo.ai')
WITH CHECK ((auth.jwt() ->> 'email') = 'support@joinfinlo.ai');