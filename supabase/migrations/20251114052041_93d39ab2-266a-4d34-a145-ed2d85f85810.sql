-- Fix the handle_new_user function to set BOTH id and user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,        -- Explicitly set id to match auth.users.id
    user_id,   -- Also set user_id to match
    email, 
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,    -- Same value for both id and user_id
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.email
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    id = EXCLUDED.id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  
  RETURN NEW;
END;
$$;

-- Create the missing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Fix existing broken records where id != user_id
UPDATE profiles 
SET id = user_id 
WHERE id != user_id;

-- Add constraint to prevent future mismatches
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_matches_user_id;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_matches_user_id 
CHECK (id = user_id);