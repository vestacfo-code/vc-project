
-- Add unique constraint to prevent duplicate permissions for the same user
-- This ensures each user can only have each permission once
ALTER TABLE public.admin_permissions 
ADD CONSTRAINT admin_permissions_user_permission_unique 
UNIQUE (user_id, permission);

-- Create an index to improve performance when querying permissions by user
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id 
ON public.admin_permissions(user_id);

-- Create an index to improve performance when querying by permission
CREATE INDEX IF NOT EXISTS idx_admin_permissions_permission 
ON public.admin_permissions(permission);
