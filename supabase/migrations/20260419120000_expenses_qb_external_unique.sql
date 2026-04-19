-- Idempotent QuickBooks (and other accounting) syncs via upsert on external_id.
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_hotel_source_external_id
  ON public.expenses (hotel_id, source, external_id)
  WHERE external_id IS NOT NULL;
