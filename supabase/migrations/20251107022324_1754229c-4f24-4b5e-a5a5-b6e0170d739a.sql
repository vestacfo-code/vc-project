-- Add demo_scheduled to crm_contact_status enum
ALTER TYPE crm_contact_status ADD VALUE IF NOT EXISTS 'demo_scheduled';