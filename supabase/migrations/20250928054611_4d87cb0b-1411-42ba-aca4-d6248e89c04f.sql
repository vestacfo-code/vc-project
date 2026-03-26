-- Add unique constraint for QuickBooks data upserts
ALTER TABLE quickbooks_data 
ADD CONSTRAINT quickbooks_data_unique_constraint 
UNIQUE (integration_id, data_type, quickbooks_id);