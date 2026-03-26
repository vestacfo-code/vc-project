-- Fix RLS policies for user_credits table to ensure proper security

-- First, let's ensure RLS is enabled (should already be enabled)
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop any potentially problematic policies that might allow public access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_credits;
DROP POLICY IF EXISTS "Public read access" ON public.user_credits;
DROP POLICY IF EXISTS "Allow public read" ON public.user_credits;

-- Ensure we have the correct restrictive policies
-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Service role can manage all credits" ON public.user_credits;

-- Recreate secure policies
CREATE POLICY "Users can view their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits" 
ON public.user_credits 
FOR ALL 
USING (auth.role() = 'service_role');

-- Ensure no INSERT or DELETE policies for regular users (only service role)
-- Regular users should not be able to insert or delete credit records