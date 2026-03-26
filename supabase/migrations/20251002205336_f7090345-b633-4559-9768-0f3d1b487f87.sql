-- Fix remaining functions missing SET search_path = public

-- Fix generate_job_slug
CREATE OR REPLACE FUNCTION public.generate_job_slug(title text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
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

-- Fix auto_generate_job_slug
CREATE OR REPLACE FUNCTION public.auto_generate_job_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_job_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$function$;