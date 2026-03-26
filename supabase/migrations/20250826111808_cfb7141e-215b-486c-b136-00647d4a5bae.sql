-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT NOT NULL UNIQUE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured_image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for blog posts
CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admin can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'support@finlo.ai')
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'support@finlo.ai');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_post_updated_at();

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'))) 
         || '-' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql;