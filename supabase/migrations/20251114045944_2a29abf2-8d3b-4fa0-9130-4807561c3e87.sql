-- Step 1: Migrate all permissions from user_permissions to admin_permissions
-- This handles potential duplicates by using ON CONFLICT DO NOTHING

-- Copy all permissions from user_permissions to admin_permissions
INSERT INTO admin_permissions (user_id, permission, granted_by, granted_at)
SELECT 
  user_id,
  permission,
  granted_by,
  granted_at
FROM user_permissions
ON CONFLICT (user_id, permission) DO NOTHING;

-- Log the migration
DO $$
DECLARE
  migrated_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM user_permissions;
  SELECT COUNT(*) INTO duplicate_count FROM admin_permissions;
  
  RAISE NOTICE 'Migration complete: % records in user_permissions, % records now in admin_permissions', 
    migrated_count, duplicate_count;
END $$;