-- Create BusinessProfile, FinancialSnapshot, ValuationRun tables with RLS and triggers
-- 1) Business Profiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  legal_name TEXT,
  trade_name TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  industry_naics TEXT,
  model TEXT,
  start_date DATE,
  employees_fulltime INTEGER,
  owners_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_profiles' AND policyname = 'Users can manage their own business profiles'
  ) THEN
    CREATE POLICY "Users can manage their own business profiles"
    ON public.business_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 2) Financial Snapshots
CREATE TABLE IF NOT EXISTS public.financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue NUMERIC,
  cogs NUMERIC,
  gross_margin_pct NUMERIC,
  operating_expenses NUMERIC,
  ebitda NUMERIC,
  sde NUMERIC,
  arr NUMERIC,
  mrr NUMERIC,
  growth_3m_pct NUMERIC,
  growth_12m_pct NUMERIC,
  churn_logo_pct NUMERIC,
  churn_revenue_pct NUMERIC,
  arpu NUMERIC,
  ltv NUMERIC,
  cac NUMERIC,
  net_dollar_retention_pct NUMERIC,
  cash_balance NUMERIC,
  debt_balance NUMERIC,
  inventory_value NUMERIC,
  last_12m_taxable_income NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'financial_snapshots' AND policyname = 'Users can manage their own financial snapshots'
  ) THEN
    CREATE POLICY "Users can manage their own financial snapshots"
    ON public.financial_snapshots
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Valuation Runs
CREATE TABLE IF NOT EXISTS public.valuation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method_used TEXT,
  inputs_json JSONB,
  documents_used JSONB,
  valuation_low NUMERIC,
  valuation_base NUMERIC,
  valuation_high NUMERIC,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  pdf_url TEXT,
  share_slug TEXT UNIQUE
);

ALTER TABLE public.valuation_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'valuation_runs' AND policyname = 'Users can manage their own valuation runs'
  ) THEN
    CREATE POLICY "Users can manage their own valuation runs"
    ON public.valuation_runs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_business_period ON public.financial_snapshots (business_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_valuation_runs_business_created ON public.valuation_runs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user ON public.business_profiles (user_id);

-- Triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_business_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_business_profiles_updated_at
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_financial_snapshots_updated_at'
  ) THEN
    CREATE TRIGGER trg_financial_snapshots_updated_at
    BEFORE UPDATE ON public.financial_snapshots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_valuation_runs_updated_at'
  ) THEN
    CREATE TRIGGER trg_valuation_runs_updated_at
    BEFORE UPDATE ON public.valuation_runs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
