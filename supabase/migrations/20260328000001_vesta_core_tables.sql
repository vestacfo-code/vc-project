-- ============================================================
-- VESTA HOTEL CFO — Phase 3: Core Tables
-- Organizations, Hotels, Hotel Members
-- ============================================================

-- ── ORGANIZATIONS ──────────────────────────────────────────
-- A hotel management company that can own multiple properties.

CREATE TABLE public.organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL DEFAULT 'starter'
                CHECK (plan IN ('starter', 'growth', 'enterprise')),
  stripe_customer_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    auth.uid() = owner_user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members hm
      JOIN public.hotels h ON h.id = hm.hotel_id
      WHERE h.organization_id = organizations.id
    )
  );

CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (auth.uid() = owner_user_id);


-- ── HOTELS ─────────────────────────────────────────────────
-- Individual hotel properties belonging to an organization.

CREATE TABLE public.hotels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  country         TEXT NOT NULL DEFAULT 'US',
  room_count      INTEGER NOT NULL CHECK (room_count > 0),
  star_rating     NUMERIC(2,1) CHECK (star_rating >= 1 AND star_rating <= 5),
  property_type   TEXT NOT NULL DEFAULT 'independent'
                  CHECK (property_type IN ('independent', 'boutique', 'chain', 'resort', 'extended_stay')),
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  currency        TEXT NOT NULL DEFAULT 'USD',
  logo_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotels_select" ON public.hotels
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members WHERE hotel_id = hotels.id
    ) OR
    auth.uid() IN (
      SELECT owner_user_id FROM public.organizations WHERE id = hotels.organization_id
    )
  );

CREATE POLICY "hotels_insert" ON public.hotels
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_user_id FROM public.organizations WHERE id = organization_id
    )
  );

CREATE POLICY "hotels_update" ON public.hotels
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_user_id FROM public.organizations WHERE id = hotels.organization_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members
      WHERE hotel_id = hotels.id AND role IN ('owner', 'manager')
    )
  );


-- ── HOTEL MEMBERS ───────────────────────────────────────────
-- Maps users to hotels with role-based access.

CREATE TABLE public.hotel_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('owner', 'manager', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, user_id)
);

ALTER TABLE public.hotel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select" ON public.hotel_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members hm2
      WHERE hm2.hotel_id = hotel_members.hotel_id AND hm2.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "members_insert" ON public.hotel_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members
      WHERE hotel_id = hotel_members.hotel_id AND role IN ('owner', 'manager')
    ) OR
    auth.uid() IN (
      SELECT o.owner_user_id FROM public.organizations o
      JOIN public.hotels h ON h.organization_id = o.id
      WHERE h.id = hotel_members.hotel_id
    )
  );

CREATE POLICY "members_delete" ON public.hotel_members
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.hotel_members
      WHERE hotel_id = hotel_members.hotel_id AND role = 'owner'
    )
  );

-- Indexes
CREATE INDEX idx_hotels_org ON public.hotels(organization_id);
CREATE INDEX idx_hotel_members_hotel ON public.hotel_members(hotel_id);
CREATE INDEX idx_hotel_members_user ON public.hotel_members(user_id);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
