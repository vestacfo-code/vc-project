-- ============================================================
-- VESTA HOTEL CFO — Phase 3: Integration Tables
-- Integrations, Sync Logs
-- ============================================================

-- ── INTEGRATIONS ────────────────────────────────────────────
-- Connected data sources (PMS, OTA, payroll, accounting, banking).

CREATE TABLE public.integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                CHECK (type IN ('pms', 'ota', 'payroll', 'pos', 'accounting', 'banking')),
  provider      TEXT NOT NULL,  -- mews, cloudbeds, opera, quickbooks, plaid, etc.
  -- Credentials stored as encrypted JSON via Supabase Vault in production
  -- During development: plain JSON (rotate before prod)
  credentials   JSONB,
  settings      JSONB DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('active', 'disconnected', 'error', 'pending')),
  error_message TEXT,
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_hotel_member" ON public.integrations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members
      WHERE hotel_id = integrations.hotel_id
    )
  );


-- ── SYNC LOGS ───────────────────────────────────────────────
-- Records every data sync attempt for audit trail and debugging.

CREATE TABLE public.sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id  UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  status          TEXT NOT NULL
                  CHECK (status IN ('success', 'partial', 'failed', 'running')),
  records_synced  INTEGER DEFAULT 0,
  records_failed  INTEGER DEFAULT 0,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_logs_hotel_member" ON public.sync_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members
      WHERE hotel_id = sync_logs.hotel_id
    )
  );

-- Indexes
CREATE INDEX idx_integrations_hotel ON public.integrations(hotel_id);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_sync_logs_integration ON public.sync_logs(integration_id);
CREATE INDEX idx_sync_logs_hotel_started ON public.sync_logs(hotel_id, started_at DESC);

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
