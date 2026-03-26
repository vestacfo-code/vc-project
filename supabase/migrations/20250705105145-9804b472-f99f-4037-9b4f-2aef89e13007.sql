-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_settings table for user preferences
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  weekly_reports_enabled BOOLEAN DEFAULT TRUE,
  alerts_enabled BOOLEAN DEFAULT TRUE,
  day_of_week TEXT DEFAULT 'monday',
  time_of_day TEXT DEFAULT '09:00',
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can manage their own notifications" 
ON public.notifications 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for email_settings
CREATE POLICY "Users can manage their own email settings" 
ON public.email_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();