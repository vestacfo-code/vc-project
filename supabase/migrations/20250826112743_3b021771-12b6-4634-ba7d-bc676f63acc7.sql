-- Fix RLS policies to ensure published posts are always visible
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;

-- Create a policy that allows anyone (including anonymous users) to view published posts
CREATE POLICY "Public can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
TO public
USING (status = 'published');

-- Also create a policy for authenticated users to view published posts
CREATE POLICY "Authenticated users can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
TO authenticated
USING (status = 'published');