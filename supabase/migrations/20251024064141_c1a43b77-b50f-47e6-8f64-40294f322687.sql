-- Create wave_integrations table
CREATE TABLE public.wave_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  currency TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Create wave_data table
CREATE TABLE public.wave_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.wave_integrations(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  wave_id TEXT NOT NULL,
  data_json JSONB NOT NULL,
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, data_type, wave_id)
);

-- Enable RLS
ALTER TABLE public.wave_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wave_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wave_integrations
CREATE POLICY "Users can manage their own Wave integrations"
  ON public.wave_integrations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for wave_data
CREATE POLICY "Users can manage their own Wave data"
  ON public.wave_data
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Edge functions can insert Wave data"
  ON public.wave_data
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_wave_integrations_user_id ON public.wave_integrations(user_id);
CREATE INDEX idx_wave_data_user_id ON public.wave_data(user_id);
CREATE INDEX idx_wave_data_integration_id ON public.wave_data(integration_id);
CREATE INDEX idx_wave_data_data_type ON public.wave_data(data_type);