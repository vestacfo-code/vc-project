-- Update crm_call_logs foreign key to cascade on delete
-- This allows deleting contacts even if they have call logs
ALTER TABLE crm_call_logs
DROP CONSTRAINT IF EXISTS crm_call_logs_contact_id_fkey;

ALTER TABLE crm_call_logs
ADD CONSTRAINT crm_call_logs_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES crm_contacts(id)
ON DELETE CASCADE;

-- Also update crm_deals foreign key to cascade on delete
ALTER TABLE crm_deals
DROP CONSTRAINT IF EXISTS crm_deals_contact_id_fkey;

ALTER TABLE crm_deals
ADD CONSTRAINT crm_deals_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES crm_contacts(id)
ON DELETE CASCADE;

-- Also update crm_activities foreign key to cascade on delete
ALTER TABLE crm_activities
DROP CONSTRAINT IF EXISTS crm_activities_contact_id_fkey;

ALTER TABLE crm_activities
ADD CONSTRAINT crm_activities_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES crm_contacts(id)
ON DELETE CASCADE;