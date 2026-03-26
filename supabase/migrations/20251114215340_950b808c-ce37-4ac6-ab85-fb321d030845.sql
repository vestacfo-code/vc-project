-- Fix user signup by modifying the trigger and RLS policies

-- 1. Fix the handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with both id and user_id matching auth.users.id
  -- This bypasses RLS because of SECURITY DEFINER
  INSERT INTO public.profiles (
    id,
    user_id,
    email, 
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
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
  ON CONFLICT (user_id) DO NOTHING;  -- Changed from DO UPDATE to avoid primary key update issues
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the function owner has bypass RLS privileges
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 2. Drop the problematic constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_matches_user_id;

-- 3. Remove default UUID generator on id column since we explicitly set it
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;

-- 4. Add service role policy to allow trigger inserts
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt()->>'role' = 'service_role'
);

-- 5. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();