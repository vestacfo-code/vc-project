-- Fix security warnings by setting search_path for functions

-- Update generate_welcome_slug function
CREATE OR REPLACE FUNCTION generate_welcome_slug()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;