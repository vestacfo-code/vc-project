-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_permissions(uuid);

-- Create admin_permissions table for granular permission management
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage all permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.admin_permissions;

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage all permissions"
ON public.admin_permissions
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Create function to get user permissions efficiently
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE (permission TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT permission
  FROM public.admin_permissions
  WHERE user_id = _user_id;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON public.admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_permission ON public.admin_permissions(permission);