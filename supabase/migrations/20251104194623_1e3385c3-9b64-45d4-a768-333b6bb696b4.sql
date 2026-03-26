-- Fix shared_conversations RLS policy to prevent token enumeration
DROP POLICY IF EXISTS "Public can view with valid token" ON public.shared_conversations;

-- Create restrictive policy that only allows access via the security definer function
CREATE POLICY "Access via security definer function only"
  ON public.shared_conversations FOR SELECT
  USING (false);

-- Allow inserts for authenticated users creating shares
CREATE POLICY "Users can create shares"
  ON public.shared_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);