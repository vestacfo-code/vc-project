-- Create a function to call the send-welcome-email edge function
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function via pg_net (if available) or log for manual setup
  -- Note: This trigger logs the signup for now. The edge function can be triggered
  -- via Supabase webhooks configured in the dashboard.
  RAISE LOG 'New user signup: %', NEW.email;
  RETURN NEW;
END;
$$;

-- Note: For the welcome email to work automatically, you need to configure a 
-- database webhook in the Supabase Dashboard:
-- 1. Go to Database → Webhooks
-- 2. Create a new webhook for the auth.users table on INSERT
-- 3. Point it to your send-welcome-email edge function
-- This is the recommended approach as it handles authentication properly.