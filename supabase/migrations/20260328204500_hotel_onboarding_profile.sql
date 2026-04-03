-- Onboarding: wider property types, optional PMS column, JSON profile for goals/role/etc.

ALTER TABLE public.hotels DROP CONSTRAINT IF EXISTS hotels_property_type_check;

ALTER TABLE public.hotels ADD CONSTRAINT hotels_property_type_check CHECK (
  property_type IN (
    'independent',
    'boutique',
    'chain',
    'resort',
    'extended_stay',
    'hostel',
    'serviced_apartment'
  )
);

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS pms_provider text;

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS onboarding_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.hotels.onboarding_profile IS 'Operator context from signup: role, goals, data approach, portfolio size, notes (see app HotelOnboarding).';
COMMENT ON COLUMN public.hotels.pms_provider IS 'Primary PMS id from onboarding (mews, cloudbeds, none, etc.).';
