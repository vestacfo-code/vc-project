-- Create zoho_integrations table
CREATE TABLE public.zoho_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  data_center TEXT NOT NULL,
  api_domain TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  currency_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on zoho_integrations
ALTER TABLE public.zoho_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for zoho_integrations
CREATE POLICY "Users can manage their own Zoho integrations"
ON public.zoho_integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create zoho_data table
CREATE TABLE public.zoho_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_id UUID NOT NULL REFERENCES public.zoho_integrations(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  zoho_id TEXT NOT NULL,
  data_json JSONB NOT NULL,
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, data_type, zoho_id)
);

-- Enable RLS on zoho_data
ALTER TABLE public.zoho_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for zoho_data
CREATE POLICY "Users can manage their own Zoho data"
ON public.zoho_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_zoho_integrations_user_active ON public.zoho_integrations(user_id, is_active);
CREATE INDEX idx_zoho_data_user_integration ON public.zoho_data(user_id, integration_id);
CREATE INDEX idx_zoho_data_integration_type ON public.zoho_data(integration_id, data_type);

-- Trigger to update updated_at on zoho_integrations
CREATE TRIGGER update_zoho_integrations_updated_at
BEFORE UPDATE ON public.zoho_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();