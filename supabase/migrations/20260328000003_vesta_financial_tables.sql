-- ============================================================
-- VESTA HOTEL CFO — Phase 3: Financial Data Tables
-- daily_metrics, revenue_by_channel, expenses, budget_targets
-- ============================================================

-- ── DAILY METRICS ───────────────────────────────────────────
-- Core hotel KPIs calculated and stored daily.
-- Source of truth for all dashboard charts and AI analysis.

CREATE TABLE public.daily_metrics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  date              DATE NOT NULL,

  -- Occupancy
  rooms_available   INTEGER NOT NULL CHECK (rooms_available > 0),
  rooms_sold        INTEGER NOT NULL DEFAULT 0,
  rooms_out_of_order INTEGER NOT NULL DEFAULT 0,
  occupancy_rate    NUMERIC(5,4) GENERATED ALWAYS AS (
    CASE WHEN rooms_available > 0 THEN rooms_sold::NUMERIC / rooms_available ELSE 0 END
  ) STORED,

  -- Rate metrics
  adr               NUMERIC(10,2) DEFAULT 0,  -- Average Daily Rate
  revpar            NUMERIC(10,2) DEFAULT 0,  -- Revenue Per Available Room

  -- Revenue
  total_revenue     NUMERIC(12,2) DEFAULT 0,
  room_revenue      NUMERIC(12,2) DEFAULT 0,
  fnb_revenue       NUMERIC(12,2) DEFAULT 0,  -- Food & Beverage
  spa_revenue       NUMERIC(12,2) DEFAULT 0,
  other_revenue     NUMERIC(12,2) DEFAULT 0,

  -- Labor
  labor_cost        NUMERIC(12,2) DEFAULT 0,
  labor_cost_ratio  NUMERIC(5,4) DEFAULT 0,   -- labor_cost / total_revenue

  -- Profitability
  total_expenses    NUMERIC(12,2) DEFAULT 0,
  gop               NUMERIC(12,2) DEFAULT 0,  -- Gross Operating Profit
  goppar            NUMERIC(10,2) DEFAULT 0,  -- GOP Per Available Room
  gop_margin        NUMERIC(5,4) DEFAULT 0,   -- gop / total_revenue

  -- Metadata
  data_source       TEXT DEFAULT 'manual',    -- 'pms_sync' | 'manual' | 'estimated'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (hotel_id, date)
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_metrics_hotel_member" ON public.daily_metrics
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = daily_metrics.hotel_id
    )
  );

CREATE INDEX idx_daily_metrics_hotel_date ON public.daily_metrics(hotel_id, date DESC);
CREATE INDEX idx_daily_metrics_date ON public.daily_metrics(date);

CREATE TRIGGER trg_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── REVENUE BY CHANNEL ──────────────────────────────────────
-- Revenue breakdown by booking source (OTA, direct, corporate, etc.)

CREATE TABLE public.revenue_by_channel (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  channel          TEXT NOT NULL
                   CHECK (channel IN ('direct', 'booking_com', 'expedia', 'airbnb',
                                      'corporate', 'walk_in', 'gds', 'other')),
  revenue          NUMERIC(12,2) DEFAULT 0,
  bookings_count   INTEGER DEFAULT 0,
  room_nights      INTEGER DEFAULT 0,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  commission_rate  NUMERIC(5,4) DEFAULT 0,
  net_revenue      NUMERIC(12,2) GENERATED ALWAYS AS (revenue - commission_amount) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, date, channel)
);

ALTER TABLE public.revenue_by_channel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rev_channel_hotel_member" ON public.revenue_by_channel
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = revenue_by_channel.hotel_id
    )
  );

CREATE INDEX idx_rev_channel_hotel_date ON public.revenue_by_channel(hotel_id, date DESC);


-- ── EXPENSES ────────────────────────────────────────────────
-- Individual expense line items (from accounting integration or manual entry).

CREATE TABLE public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  category        TEXT NOT NULL
                  CHECK (category IN (
                    'labor', 'utilities', 'food_beverage', 'maintenance',
                    'marketing', 'insurance', 'property_tax', 'supplies',
                    'technology', 'distribution', 'management_fee', 'other'
                  )),
  subcategory     TEXT,
  vendor          TEXT,
  description     TEXT,
  amount          NUMERIC(12,2) NOT NULL,
  is_recurring    BOOLEAN DEFAULT FALSE,
  source          TEXT DEFAULT 'manual',  -- 'quickbooks' | 'xero' | 'manual'
  external_id     TEXT,                   -- ID from source system
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_hotel_member" ON public.expenses
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = expenses.hotel_id
    )
  );

CREATE INDEX idx_expenses_hotel_date ON public.expenses(hotel_id, date DESC);
CREATE INDEX idx_expenses_category ON public.expenses(hotel_id, category);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── BUDGET TARGETS ──────────────────────────────────────────
-- Monthly budget targets for KPI comparison.

CREATE TABLE public.budget_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_occupancy NUMERIC(5,4),
  target_adr      NUMERIC(10,2),
  target_revpar   NUMERIC(10,2),
  target_revenue  NUMERIC(12,2),
  target_gop      NUMERIC(12,2),
  target_labor_ratio NUMERIC(5,4),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, year, month)
);

ALTER TABLE public.budget_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_hotel_member" ON public.budget_targets
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = budget_targets.hotel_id
    )
  );

CREATE INDEX idx_budget_hotel_year_month ON public.budget_targets(hotel_id, year, month);

CREATE TRIGGER trg_budget_updated_at
  BEFORE UPDATE ON public.budget_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
