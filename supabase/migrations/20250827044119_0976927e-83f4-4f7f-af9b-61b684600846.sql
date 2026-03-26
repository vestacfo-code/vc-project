-- Update the slug generation function to create cleaner slugs
CREATE OR REPLACE FUNCTION public.generate_job_slug(title text)
RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Convert title to lowercase, replace spaces with hyphens, remove special chars
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'), 
      '\s+', 
      '-', 
      'g'
    )
  );
END;
$function$;

-- Update existing job roles to use cleaner slugs
UPDATE job_roles 
SET slug = generate_job_slug(title)
WHERE is_active = true;

-- Update the trigger to use the new clean slug generation
CREATE OR REPLACE FUNCTION public.auto_generate_job_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_job_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$function$;