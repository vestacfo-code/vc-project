-- Create welcome_links table for managing personalized welcome pages
CREATE TABLE public.welcome_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_date DATE,
  supervisors JSONB DEFAULT '[]'::jsonb, -- Array of {name, linkedin_url}
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create preboarding_steps table for tracking completion
CREATE TABLE public.preboarding_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  welcome_link_id UUID NOT NULL REFERENCES welcome_links(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL, -- 'emergency_info', 'documents', 'tools_setup'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
  data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table for admin hub (if not exists)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_name TEXT NOT NULL,
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  featured_image_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  tags TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create press_releases table for admin hub
CREATE TABLE public.press_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_name TEXT NOT NULL,
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  featured_image_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  press_contact TEXT,
  release_date DATE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.welcome_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_releases ENABLE ROW LEVEL SECURITY;

-- Create policies for welcome_links
CREATE POLICY "Admin can manage welcome links" ON public.welcome_links
FOR ALL USING ((auth.jwt() ->> 'email') = ANY (ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']));

CREATE POLICY "Public can view active welcome links" ON public.welcome_links
FOR SELECT USING (status = 'active');

-- Create policies for preboarding_steps
CREATE POLICY "Admin can manage preboarding steps" ON public.preboarding_steps
FOR ALL USING ((auth.jwt() ->> 'email') = ANY (ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']));

CREATE POLICY "Public can view and update preboarding steps" ON public.preboarding_steps
FOR ALL USING (TRUE);

-- Create policies for press_releases
CREATE POLICY "Admin can manage press releases" ON public.press_releases
FOR ALL USING ((auth.jwt() ->> 'email') = ANY (ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']));

CREATE POLICY "Public can view published press releases" ON public.press_releases
FOR SELECT USING (status = 'published');

-- Create function to generate unique welcome slugs
CREATE OR REPLACE FUNCTION generate_welcome_slug()
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric slug
    slug := substr(md5(random()::text || counter::text), 1, 8);
    
    -- Check if slug exists
    IF NOT EXISTS (SELECT 1 FROM welcome_links WHERE welcome_links.slug = slug) THEN
      RETURN slug;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique slug after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at on welcome_links
CREATE TRIGGER update_welcome_links_updated_at
BEFORE UPDATE ON public.welcome_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on preboarding_steps  
CREATE TRIGGER update_preboarding_steps_updated_at
BEFORE UPDATE ON public.preboarding_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on press_releases
CREATE TRIGGER update_press_releases_updated_at
BEFORE UPDATE ON public.press_releases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();