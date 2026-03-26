-- Fix subscription_changes security - restrict access to sensitive subscription data
-- Drop existing policies to start fresh and ensure proper security
DROP POLICY IF EXISTS "Service role can manage subscription changes" ON public.subscription_changes;
DROP POLICY IF EXISTS "Users can view their own subscription changes" ON public.subscription_changes;

-- Ensure RLS is enabled
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;

-- 1. Service role has full access for backend subscription management
CREATE POLICY "subscription_changes_service_role_all" 
ON public.subscription_changes 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can only view their own subscription changes
CREATE POLICY "subscription_changes_user_select_own" 
ON public.subscription_changes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. No anonymous access - prevent public exposure of subscription data
-- (No policies for anon role, ensuring complete privacy)

-- 4. No user insert/update/delete permissions - only service role should manage subscription changes
-- This ensures data integrity and prevents tampering with subscription history