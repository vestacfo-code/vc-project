-- Create user_settings table to persist all user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- General settings
  theme TEXT NOT NULL DEFAULT 'system',
  accent_color TEXT NOT NULL DEFAULT 'default',
  language TEXT NOT NULL DEFAULT 'auto',
  spoken_language TEXT NOT NULL DEFAULT 'auto',
  voice TEXT NOT NULL DEFAULT 'spruce',
  show_additional_models BOOLEAN NOT NULL DEFAULT true,
  
  -- Notification settings
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT false,
  
  -- Schedule settings
  weekly_reports BOOLEAN NOT NULL DEFAULT true,
  monthly_summaries BOOLEAN NOT NULL DEFAULT false,
  
  -- Security settings
  two_factor_auth BOOLEAN NOT NULL DEFAULT false,
  session_timeout TEXT NOT NULL DEFAULT '30',
  
  -- Data control settings
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  export_format TEXT NOT NULL DEFAULT 'json',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize user settings on signup
CREATE OR REPLACE FUNCTION public.initialize_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to initialize settings when user signs up
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_settings();