-- Fix function security warnings by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'))) 
         || '-' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';