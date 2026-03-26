-- Enable realtime for quickbooks_integrations table
ALTER TABLE quickbooks_integrations REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE quickbooks_integrations;