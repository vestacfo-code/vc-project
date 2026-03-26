-- Fix overly permissive RLS policy on preboarding_steps table
-- This migration removes the "USING (TRUE)" policy and replaces it with secure policies

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view and update preboarding steps" ON public.preboarding_steps;

-- Create secure policies for preboarding_steps

-- 1. Allow SELECT access only for steps associated with active welcome links (for applicants viewing their own data)
CREATE POLICY "Secure welcome link SELECT access to preboarding steps"
  ON public.preboarding_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM welcome_links wl
      WHERE wl.id = preboarding_steps.welcome_link_id
        AND wl.status = 'active'
        AND wl.deleted_at IS NULL
    )
  );

-- 2. Allow INSERT for new preboarding steps via active welcome links
CREATE POLICY "Secure welcome link INSERT for preboarding steps"
  ON public.preboarding_steps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM welcome_links wl
      WHERE wl.id = preboarding_steps.welcome_link_id
        AND wl.status = 'active'
        AND wl.deleted_at IS NULL
    )
  );

-- 3. Allow UPDATE for preboarding steps via active welcome links
CREATE POLICY "Secure welcome link UPDATE for preboarding steps"
  ON public.preboarding_steps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM welcome_links wl
      WHERE wl.id = preboarding_steps.welcome_link_id
        AND wl.status = 'active'
        AND wl.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM welcome_links wl
      WHERE wl.id = preboarding_steps.welcome_link_id
        AND wl.status = 'active'
        AND wl.deleted_at IS NULL
    )
  );

-- 4. Allow authenticated users with admin/super_admin role to manage all preboarding steps
CREATE POLICY "Admins can manage all preboarding steps"
  ON public.preboarding_steps
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );