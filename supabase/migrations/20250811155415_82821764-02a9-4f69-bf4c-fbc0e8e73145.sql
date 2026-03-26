-- Tighten RLS policies on public.subscribers to prevent unauthorized inserts/updates
-- Existing SELECT policy remains unchanged

-- 1) Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- 2) Create secure INSERT policy: users can only insert their own subscription row
CREATE POLICY "insert_own_subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) OR (email = auth.email())
);

-- 3) Create secure UPDATE policy: users can only update their own subscription row
CREATE POLICY "update_own_subscription_secure"
ON public.subscribers
FOR UPDATE
USING (
  (auth.uid() = user_id) OR (email = auth.email())
)
WITH CHECK (
  (auth.uid() = user_id) OR (email = auth.email())
);
