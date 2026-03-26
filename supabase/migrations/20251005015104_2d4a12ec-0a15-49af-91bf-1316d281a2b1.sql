-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle both email/password and Google SSO users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Try 'full_name' first (email/password), then 'name' (Google SSO), fallback to email
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.email
    ),
    -- Capture avatar from Google SSO (stored as 'avatar_url' or 'picture')
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();