CREATE TABLE public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  horizon_days INTEGER NOT NULL DEFAULT 90,
  historical_days INTEGER NOT NULL DEFAULT 0,
  trend_revpar_slope NUMERIC,
  trend_occupancy_slope NUMERIC,
  trend_revenue_slope NUMERIC,
  projections JSONB NOT NULL DEFAULT '[]',
  UNIQUE (hotel_id, generated_at)
);
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forecasts_hotel_member" ON public.forecasts
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = forecasts.hotel_id
    )
  );
CREATE INDEX idx_forecasts_hotel ON public.forecasts(hotel_id, generated_at DESC);
