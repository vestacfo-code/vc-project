-- Add content calendar permissions to the admin_permission enum
-- These allow granular control over content calendar access

ALTER TYPE admin_permission ADD VALUE IF NOT EXISTS 'content_calendar_view';
ALTER TYPE admin_permission ADD VALUE IF NOT EXISTS 'content_calendar_create';
ALTER TYPE admin_permission ADD VALUE IF NOT EXISTS 'content_calendar_edit';
ALTER TYPE admin_permission ADD VALUE IF NOT EXISTS 'content_calendar_delete';