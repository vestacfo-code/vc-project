-- Fix discount_codes security - protect promotional strategy and customer emails
-- Drop existing policies to ensure proper security implementation
DROP POLICY IF EXISTS "Service role can manage discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Users can view their own discount codes" ON public.discount_codes;

-- Ensure RLS is enabled
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- 1. Service role has full access for backend discount management
CREATE POLICY "discount_codes_service_role_all" 
ON public.discount_codes 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can only view discount codes assigned to them
CREATE POLICY "discount_codes_user_select_own" 
ON public.discount_codes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Special admin access for authorized emails to manage discount codes
CREATE POLICY "discount_codes_admin_select" 
ON public.discount_codes 
FOR SELECT 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
);

-- 4. Special admin access for authorized emails to manage discount codes
CREATE POLICY "discount_codes_admin_all" 
ON public.discount_codes 
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('finlo.hq@gmail.com', 'founder@joinfinlo.ai')
);

-- 5. No anonymous access - prevent public exposure of promotional strategy
-- (No policies for anon role, ensuring complete privacy of discount strategy)