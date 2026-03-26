-- Fix profiles table RLS policies to allow users to manage their own profiles

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);