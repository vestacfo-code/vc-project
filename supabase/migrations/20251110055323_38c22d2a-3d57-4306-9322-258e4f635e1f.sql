-- Add 'staff' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';

-- Update the comment to reflect the new role structure
COMMENT ON TYPE app_role IS 'Application roles: admin (basic admin), hr_staff (HR functions), super_admin (full access), staff (customizable per-user permissions)';
