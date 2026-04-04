-- ============================================================
-- VESTA HOTEL CFO — Phase 3: AI Tables
-- ai_summaries, anomalies, recommendations, chat_sessions
-- ============================================================

-- ── AI SUMMARIES ────────────────────────────────────────────
-- AI-generated daily/weekly/monthly briefings for each hotel.

CREATE TABLE public.ai_summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  period_type  TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  headline     TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'on_track'
               CHECK (status IN ('on_track', 'attention_needed', 'critical')),
  -- Key metrics snapshot used to generate this summary
  metrics_snapshot JSONB DEFAULT '{}',
  model        TEXT DEFAULT 'gpt-4o',
  tokens_used  INTEGER,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, date, period_type)
);

ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_summaries_hotel_member" ON public.ai_summaries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = ai_summaries.hotel_id
    )
  );

CREATE INDEX idx_ai_summaries_hotel_date ON public.ai_summaries(hotel_id, date DESC);


-- ── ANOMALIES ───────────────────────────────────────────────
-- Detected metric anomalies that need the owner's attention.

CREATE TABLE public.anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  metric          TEXT NOT NULL,  -- 'occupancy_rate' | 'adr' | 'labor_cost' | etc.
  severity        TEXT NOT NULL DEFAULT 'warning'
                  CHECK (severity IN ('info', 'warning', 'critical')),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  current_value   NUMERIC,
  expected_min    NUMERIC,
  expected_max    NUMERIC,
  -- Whether the hotel owner has acknowledged this anomaly
  acknowledged    BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved        BOOLEAN DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anomalies_hotel_member" ON public.anomalies
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = anomalies.hotel_id
    )
  );

CREATE INDEX idx_anomalies_hotel_date ON public.anomalies(hotel_id, date DESC);
CREATE INDEX idx_anomalies_unresolved ON public.anomalies(hotel_id, resolved, severity)
  WHERE resolved = FALSE;


-- ── RECOMMENDATIONS ─────────────────────────────────────────
-- AI-generated cost-cutting and revenue improvement suggestions.

CREATE TABLE public.recommendations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id                  UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category                  TEXT NOT NULL
                            CHECK (category IN (
                              'labor', 'energy', 'supplies', 'distribution',
                              'revenue', 'marketing', 'technology'
                            )),
  title                     TEXT NOT NULL,
  description               TEXT NOT NULL,
  estimated_savings_monthly NUMERIC(10,2),
  effort                    TEXT DEFAULT 'medium'
                            CHECK (effort IN ('low', 'medium', 'high')),
  status                    TEXT DEFAULT 'pending'
                            CHECK (status IN ('pending', 'in_progress', 'implemented', 'dismissed')),
  partner_slug              TEXT,  -- links to partner marketplace entry
  dismissed_at              TIMESTAMPTZ,
  implemented_at            TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_hotel_member" ON public.recommendations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = recommendations.hotel_id
    )
  );

CREATE INDEX idx_recommendations_hotel ON public.recommendations(hotel_id, status);


-- ── CHAT SESSIONS ───────────────────────────────────────────
-- Natural language Q&A sessions between users and Vesta AI.

CREATE TABLE public.hotel_chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,  -- Auto-generated from first message
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.hotel_chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.hotel_chat_sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',  -- tool calls, citations, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotel_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_owner" ON public.hotel_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_session_owner" ON public.hotel_chat_messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_chat_sessions WHERE id = session_id
    )
  );

CREATE INDEX idx_chat_sessions_hotel_user ON public.hotel_chat_sessions(hotel_id, user_id);
CREATE INDEX idx_chat_messages_session ON public.hotel_chat_messages(session_id, created_at);

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON public.hotel_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
