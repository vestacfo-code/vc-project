-- Fix credit_usage_log security - ensure only users can see their own data
-- First, let's check if there are any overly permissive policies and recreate them securely

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Service role can manage usage log" ON public.credit_usage_log;
DROP POLICY IF EXISTS "Users can view their own usage log" ON public.credit_usage_log;

-- Ensure RLS is enabled
ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;

-- 1. Service role needs full access for backend operations
CREATE POLICY "credit_usage_service_role_all" 
ON public.credit_usage_log 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can only view their own usage data
CREATE POLICY "credit_usage_user_select_own" 
ON public.credit_usage_log 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Authenticated users can only insert their own usage data (if needed by frontend)
CREATE POLICY "credit_usage_user_insert_own" 
ON public.credit_usage_log 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. No anonymous access - remove any public access
-- (No policies for anon role, ensuring no public access)

-- 5. No update/delete permissions for regular users (only service role should modify logs)
-- This ensures data integrity of usage logs