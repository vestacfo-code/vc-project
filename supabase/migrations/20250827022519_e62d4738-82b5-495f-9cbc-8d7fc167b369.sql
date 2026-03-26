-- Add slug field to job_roles table
ALTER TABLE public.job_roles ADD COLUMN slug TEXT;

-- Create index for slug column for better performance
CREATE INDEX idx_job_roles_slug ON public.job_roles(slug);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_job_slug(title text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$;

-- Update existing job roles with slugs
UPDATE public.job_roles 
SET slug = generate_job_slug(title) || '-' || extract(epoch from created_at)::text
WHERE slug IS NULL;

-- Make slug required for future inserts
ALTER TABLE public.job_roles ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint to ensure no duplicate slugs
ALTER TABLE public.job_roles ADD CONSTRAINT unique_job_role_slug UNIQUE (slug);

-- Create trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION auto_generate_job_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_job_slug(NEW.title) || '-' || extract(epoch from now())::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_roles_auto_slug
  BEFORE INSERT ON public.job_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_job_slug();