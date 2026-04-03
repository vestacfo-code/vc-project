-- ============================================================
-- VESTA — Missing tables not yet in the live DB
-- Safe: uses CREATE TABLE IF NOT EXISTS throughout
-- ============================================================

-- ── HOTEL CHAT SESSIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hotel_chat_sessions' AND policyname = 'chat_sessions_owner'
  ) THEN
    ALTER TABLE public.hotel_chat_sessions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "chat_sessions_owner" ON public.hotel_chat_sessions
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_hotel_user
  ON public.hotel_chat_sessions(hotel_id, user_id);

-- ── HOTEL CHAT MESSAGES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.hotel_chat_sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hotel_chat_messages' AND policyname = 'chat_messages_session_owner'
  ) THEN
    ALTER TABLE public.hotel_chat_messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "chat_messages_session_owner" ON public.hotel_chat_messages
      FOR ALL USING (
        auth.uid() IN (
          SELECT user_id FROM public.hotel_chat_sessions WHERE id = session_id
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON public.hotel_chat_messages(session_id, created_at);

-- ── RECOMMENDATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recommendations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id                  UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category                  TEXT NOT NULL CHECK (category IN (
    'labor','energy','supplies','distribution','revenue','marketing','technology'
  )),
  title                     TEXT NOT NULL,
  description               TEXT NOT NULL,
  estimated_savings_monthly NUMERIC(10,2),
  effort                    TEXT DEFAULT 'medium' CHECK (effort IN ('low','medium','high')),
  status                    TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','implemented','dismissed')),
  partner_slug              TEXT,
  dismissed_at              TIMESTAMPTZ,
  implemented_at            TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recommendations' AND policyname = 'recommendations_hotel_member'
  ) THEN
    ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "recommendations_hotel_member" ON public.recommendations
      FOR ALL USING (
        auth.uid() IN (
          SELECT user_id FROM public.hotel_members WHERE hotel_id = recommendations.hotel_id
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recommendations_hotel
  ON public.recommendations(hotel_id, status);

-- ── PARTNERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN (
    'linen_laundry','energy','payroll','pos','revenue_management',
    'channel_manager','pms','insurance','supplies','marketing','technology'
  )),
  tagline          TEXT,
  description      TEXT,
  logo_url         TEXT,
  website_url      TEXT,
  avg_savings_pct  NUMERIC(5,2),
  avg_savings_label TEXT,
  commission_type  TEXT DEFAULT 'referral' CHECK (commission_type IN ('referral','rev_share','flat_fee')),
  commission_value NUMERIC(10,2),
  is_featured      BOOLEAN DEFAULT FALSE,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'partners' AND policyname = 'partners_public_read'
  ) THEN
    ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "partners_public_read" ON public.partners
      FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_partners_category ON public.partners(category) WHERE is_active = TRUE;

-- ── PARTNER LEADS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID NOT NULL REFERENCES public.partners(id),
  hotel_id     UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  source       TEXT DEFAULT 'recommendation',
  clicked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted    BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'partner_leads' AND policyname = 'partner_leads_hotel_member'
  ) THEN
    ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "partner_leads_hotel_member" ON public.partner_leads
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── NOTIFICATION PREFERENCES ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id                UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  daily_briefing_email    BOOLEAN DEFAULT TRUE,
  daily_briefing_whatsapp BOOLEAN DEFAULT FALSE,
  anomaly_email           BOOLEAN DEFAULT TRUE,
  anomaly_whatsapp        BOOLEAN DEFAULT TRUE,
  weekly_report_email     BOOLEAN DEFAULT TRUE,
  sync_error_email        BOOLEAN DEFAULT TRUE,
  quiet_hours_start       TIME,
  quiet_hours_end         TIME,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hotel_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_preferences' AND policyname = 'notif_prefs_owner'
  ) THEN
    ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "notif_prefs_owner" ON public.notification_preferences
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── FORECASTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forecasts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id              UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  horizon_days          INTEGER NOT NULL DEFAULT 90,
  historical_days       INTEGER NOT NULL DEFAULT 0,
  trend_revpar_slope    NUMERIC,
  trend_occupancy_slope NUMERIC,
  trend_revenue_slope   NUMERIC,
  projections           JSONB NOT NULL DEFAULT '[]'
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'forecasts' AND policyname = 'forecasts_hotel_member'
  ) THEN
    ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "forecasts_hotel_member" ON public.forecasts
      FOR ALL USING (
        auth.uid() IN (
          SELECT user_id FROM public.hotel_members WHERE hotel_id = forecasts.hotel_id
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_forecasts_hotel
  ON public.forecasts(hotel_id, generated_at DESC);

-- ── Seed initial partner data ────────────────────────────────
INSERT INTO public.partners (slug, name, category, tagline, avg_savings_pct, avg_savings_label, is_featured)
VALUES
  ('linen-king',    'LinenKing',    'linen_laundry',      'Cut linen costs by up to 22%',         22.0, 'on linen & laundry', TRUE),
  ('ecolab',        'Ecolab',       'supplies',           'Housekeeping efficiency at scale',      15.0, 'on cleaning supplies', FALSE),
  ('gusto',         'Gusto',        'payroll',            'Payroll built for hospitality',         18.0, 'on payroll processing', TRUE),
  ('lightspeed',    'Lightspeed',   'pos',                'Modern POS for hotel F&B',             10.0, 'on F&B operations', FALSE),
  ('revinate',      'Revinate',     'revenue_management', 'Revenue management that pays for itself', 12.0, 'through rate optimisation', TRUE),
  ('cloudbeds',     'Cloudbeds',    'pms',                'All-in-one PMS for independent hotels', NULL, NULL, FALSE),
  ('mews',          'Mews',         'pms',                'The modern cloud PMS',                 NULL, NULL, FALSE),
  ('sertifi',       'Sertifi',      'technology',         'Digital authorizations & payments',     8.0, 'on payment processing', FALSE)
ON CONFLICT (slug) DO NOTHING;
