-- Add QuickBooks integration tables

-- Table to store QuickBooks OAuth tokens and company info
CREATE TABLE quickbooks_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  realm_id TEXT NOT NULL,
  base_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE quickbooks_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for quickbooks_integrations
CREATE POLICY "Users can manage their own QB integrations"
ON quickbooks_integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table to store QuickBooks financial data
CREATE TABLE quickbooks_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES quickbooks_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL, -- 'customer', 'item', 'account', 'transaction', etc.
  quickbooks_id TEXT NOT NULL,
  data_json JSONB NOT NULL,
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE quickbooks_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for quickbooks_data
CREATE POLICY "Users can manage their own QB data"
ON quickbooks_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX idx_quickbooks_data_integration_id ON quickbooks_data(integration_id);
CREATE INDEX idx_quickbooks_data_type ON quickbooks_data(data_type);
CREATE INDEX idx_quickbooks_data_quickbooks_id ON quickbooks_data(quickbooks_id);

-- Add updated_at trigger for quickbooks_integrations
CREATE TRIGGER update_quickbooks_integrations_updated_at
BEFORE UPDATE ON quickbooks_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();