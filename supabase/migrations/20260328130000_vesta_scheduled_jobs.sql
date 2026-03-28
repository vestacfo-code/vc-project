-- ============================================================
-- VESTA — Scheduled Daily Jobs via pg_cron + pg_net
--
-- Requires: pg_cron and pg_net extensions (both available on Supabase Pro)
-- These jobs auto-run every morning so hotel owners wake up to their briefing.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Helper: get all active hotel IDs ────────────────────────────────────────
-- Used by the cron functions to loop over every hotel.

CREATE OR REPLACE FUNCTION private.get_active_hotel_ids()
RETURNS TABLE (hotel_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.hotels ORDER BY created_at;
$$;

-- ── Trigger function: invoke an edge function for one hotel ─────────────────
CREATE OR REPLACE FUNCTION private.invoke_edge_function(
  function_name text,
  payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text := current_setting('app.supabase_url', true);
  service_key text := current_setting('app.supabase_service_role_key', true);
BEGIN
  PERFORM net.http_post(
    url     => project_url || '/functions/v1/' || function_name,
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body    => payload::text
  );
END;
$$;

-- ── Job 1: Daily briefing — runs at 6:00 AM UTC every day ──────────────────
-- For each hotel, calls generate-hotel-briefing with today's date.
-- Hotel owners wake up to their briefing already generated.

CREATE OR REPLACE FUNCTION private.run_daily_briefings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hotel record;
  today text := to_char(CURRENT_DATE, 'YYYY-MM-DD');
BEGIN
  FOR hotel IN SELECT hotel_id FROM private.get_active_hotel_ids() LOOP
    PERFORM private.invoke_edge_function(
      'generate-hotel-briefing',
      jsonb_build_object('hotel_id', hotel.hotel_id, 'date', today)
    );
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'vesta-daily-briefings',          -- job name (unique)
  '0 6 * * *',                      -- every day at 06:00 UTC
  'SELECT private.run_daily_briefings()'
);

-- ── Job 2: Anomaly detection — runs at 6:30 AM UTC every day ───────────────
-- Slightly offset from briefings so anomalies are fresh before briefing reads them.
-- Note: anomaly detection requires a user auth token; this uses a service-role
-- bypass path. The function checks hotel_members membership internally.

CREATE OR REPLACE FUNCTION private.run_daily_anomaly_scans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hotel record;
  today text := to_char(CURRENT_DATE, 'YYYY-MM-DD');
BEGIN
  FOR hotel IN SELECT hotel_id FROM private.get_active_hotel_ids() LOOP
    PERFORM private.invoke_edge_function(
      'detect-hotel-anomalies-internal',    -- see note below
      jsonb_build_object('hotel_id', hotel.hotel_id, 'date', today)
    );
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'vesta-daily-anomaly-scans',
  '30 6 * * *',                     -- every day at 06:30 UTC
  'SELECT private.run_daily_anomaly_scans()'
);

-- ── Job 3: Cleanup — delete read notifications older than 90 days ───────────
SELECT cron.schedule(
  'vesta-cleanup-old-notifications',
  '0 2 * * 0',                      -- every Sunday at 02:00 UTC
  $$
    DELETE FROM public.hotel_notifications
    WHERE read_at IS NOT NULL
      AND created_at < NOW() - INTERVAL '90 days';
  $$
);

-- ── Verify jobs were registered ─────────────────────────────────────────────
-- Run: SELECT * FROM cron.job WHERE jobname LIKE 'vesta-%';

/*
  IMPORTANT SETUP NOTES
  ─────────────────────
  1. These jobs use pg_net to POST to your Supabase Edge Functions.
     You must set two Postgres config vars so the functions can be called:

       ALTER DATABASE postgres SET app.supabase_url = 'https://<project-ref>.supabase.co';
       ALTER DATABASE postgres SET app.supabase_service_role_key = '<service-role-key>';

  2. The anomaly scan function (detect-hotel-anomalies) requires an authenticated user.
     Create a separate internal variant (detect-hotel-anomalies-internal) that accepts
     a service-role header instead of a user JWT — or modify the existing function to
     accept SUPABASE_SERVICE_ROLE_KEY as a bypass when called from pg_cron.

  3. pg_cron and pg_net are available on Supabase Pro plans.
     On free tier, use Supabase's built-in cron via the Dashboard (Settings → Cron jobs)
     or an external scheduler (GitHub Actions, Render cron, etc.).

  4. Timezones: all times are UTC. Most US hotels should use 06:00 UTC = ~1-2 AM ET,
     which means the briefing is ready by the time the GM starts their day.
     Adjust the cron schedule for your primary timezone.
*/
