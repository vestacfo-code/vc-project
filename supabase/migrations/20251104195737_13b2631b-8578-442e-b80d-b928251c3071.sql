-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policies that recursively query user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

-- The remaining policies are safe because they use the has_role() security definer function
-- or only check the current row's user_id:
-- 1. "Admin and HR can view all roles" - uses has_role() function (no recursion)
-- 2. "Super admins can manage all roles" - uses has_role() function (no recursion)  
-- 3. "Users can view their own roles" - only checks auth.uid() = user_id (no recursion)