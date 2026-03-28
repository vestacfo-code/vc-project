-- ============================================================
-- VESTA HOTEL CFO — Phase 3: Partner Marketplace & Notifications
-- partners, partner_leads, notifications, notification_preferences
-- ============================================================

-- ── PARTNERS ────────────────────────────────────────────────
-- Vendors in the Vesta partner marketplace (linen, energy, payroll, etc.)

CREATE TABLE public.partners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL
                    CHECK (category IN (
                      'linen_laundry', 'energy', 'payroll', 'pos',
                      'revenue_management', 'channel_manager', 'pms',
                      'insurance', 'supplies', 'marketing', 'technology'
                    )),
  tagline           TEXT,
  description       TEXT,
  logo_url          TEXT,
  website_url       TEXT,
  -- Typical savings this partner delivers
  avg_savings_pct   NUMERIC(5,2),  -- e.g. 18.5 = 18.5% savings
  avg_savings_label TEXT,          -- e.g. "on linen costs"
  -- Commission structure (for Vesta affiliate revenue)
  commission_type   TEXT DEFAULT 'referral'
                    CHECK (commission_type IN ('referral', 'rev_share', 'flat_fee')),
  commission_value  NUMERIC(10,2),
  is_featured       BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Partners are publicly readable
CREATE POLICY "partners_public_read" ON public.partners
  FOR SELECT USING (is_active = TRUE);

CREATE INDEX idx_partners_category ON public.partners(category) WHERE is_active = TRUE;
CREATE INDEX idx_partners_featured ON public.partners(is_featured) WHERE is_active = TRUE;


-- ── PARTNER LEADS ───────────────────────────────────────────
-- Tracks when a hotel clicks through to a partner (for commission attribution).

CREATE TABLE public.partner_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID NOT NULL REFERENCES public.partners(id),
  hotel_id     UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  source       TEXT DEFAULT 'recommendation',  -- 'recommendation' | 'marketplace' | 'alert'
  clicked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted    BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ
);

ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_leads_hotel_member" ON public.partner_leads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = partner_leads.hotel_id
    )
  );

CREATE INDEX idx_partner_leads_partner ON public.partner_leads(partner_id, clicked_at DESC);
CREATE INDEX idx_partner_leads_hotel ON public.partner_leads(hotel_id);


-- ── NOTIFICATIONS ───────────────────────────────────────────
-- In-app and push notifications sent to hotel team members.

CREATE TABLE public.hotel_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
               CHECK (type IN (
                 'anomaly', 'daily_briefing', 'weekly_report',
                 'sync_error', 'recommendation', 'system'
               )),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  link         TEXT,            -- deep-link within the app
  source_id    UUID,            -- FK to anomaly/summary/recommendation that triggered this
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotel_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner" ON public.hotel_notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.hotel_notifications(user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_hotel ON public.hotel_notifications(hotel_id, created_at DESC);


-- ── NOTIFICATION PREFERENCES ────────────────────────────────
-- Per-user, per-hotel notification channel settings.

CREATE TABLE public.notification_preferences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id      UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  daily_briefing_email    BOOLEAN DEFAULT TRUE,
  daily_briefing_whatsapp BOOLEAN DEFAULT FALSE,
  anomaly_email           BOOLEAN DEFAULT TRUE,
  anomaly_whatsapp        BOOLEAN DEFAULT TRUE,
  weekly_report_email     BOOLEAN DEFAULT TRUE,
  sync_error_email        BOOLEAN DEFAULT TRUE,
  -- Quiet hours (no alerts sent during this window)
  quiet_hours_start TIME,    -- e.g. '22:00'
  quiet_hours_end   TIME,    -- e.g. '07:00'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hotel_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_owner" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER trg_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
