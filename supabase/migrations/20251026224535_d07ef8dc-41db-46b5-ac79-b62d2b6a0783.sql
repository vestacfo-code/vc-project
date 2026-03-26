-- Add notification preferences and quiet hours columns to email_settings table
ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "credit_alerts": {"enabled": true, "method": "both"},
  "strategic_alerts": {"enabled": true, "method": "both"},
  "weekly_reports": {"enabled": true, "method": "email"},
  "financial_insights": {"enabled": true, "method": "in_app"}
}'::jsonb;

ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS quiet_hours JSONB DEFAULT '{
  "enabled": false,
  "start": "22:00",
  "end": "08:00",
  "timezone": "America/New_York"
}'::jsonb;

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to trigger weekly reports for eligible users
CREATE OR REPLACE FUNCTION trigger_weekly_reports()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  current_day INTEGER;
  current_hour INTEGER;
BEGIN
  current_day := EXTRACT(DOW FROM NOW());
  current_hour := EXTRACT(HOUR FROM NOW());
  
  FOR user_record IN 
    SELECT 
      es.user_id, 
      p.email, 
      es.day_of_week, 
      es.time_of_day,
      es.last_sent
    FROM email_settings es
    JOIN profiles p ON p.user_id = es.user_id
    WHERE es.weekly_reports_enabled = true
      AND (
        (es.day_of_week = 'monday' AND current_day = 1) OR
        (es.day_of_week = 'tuesday' AND current_day = 2) OR
        (es.day_of_week = 'wednesday' AND current_day = 3) OR
        (es.day_of_week = 'thursday' AND current_day = 4) OR
        (es.day_of_week = 'friday' AND current_day = 5) OR
        (es.day_of_week = 'saturday' AND current_day = 6) OR
        (es.day_of_week = 'sunday' AND current_day = 0)
      )
      AND EXTRACT(HOUR FROM es.time_of_day::TIME) = current_hour
      AND (es.last_sent IS NULL OR es.last_sent < NOW() - INTERVAL '6 days')
  LOOP
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/generate-weekly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'userId', user_record.user_id,
        'sendEmail', true
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule weekly report generation to run every hour
SELECT cron.schedule(
  'weekly-report-generation',
  '0 * * * *',
  $$SELECT trigger_weekly_reports();$$
);

-- Create function to trigger daily strategic alerts
CREATE OR REPLACE FUNCTION trigger_daily_strategic_alerts()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT p.user_id
    FROM profiles p
    JOIN email_settings es ON es.user_id = p.user_id
    WHERE es.alerts_enabled = true
      AND EXISTS (
        SELECT 1 FROM financial_data fd 
        WHERE fd.user_id = p.user_id
        AND fd.created_at > NOW() - INTERVAL '30 days'
      )
  LOOP
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/generate-weekly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'userId', user_record.user_id,
        'scheduled', true
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule strategic alerts to run daily at 9 AM
SELECT cron.schedule(
  'daily-strategic-alerts',
  '0 9 * * *',
  $$SELECT trigger_daily_strategic_alerts();$$
);