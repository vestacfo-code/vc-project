-- Partner catalog products + admin write policies + seed The Lotus Group
-- Reference: https://thelotusgroup.us/ — sustainable food packaging, custom branding
--
-- This file is safe to run even if public.partners or public.user_roles were never
-- created. It bootstraps those tables, then adds partner_products and policies.

-- ── PARTNERS (bootstrap if missing) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
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
  avg_savings_pct   NUMERIC(5,2),
  avg_savings_label TEXT,
  commission_type   TEXT DEFAULT 'referral'
                    CHECK (commission_type IN ('referral', 'rev_share', 'flat_fee')),
  commission_value  NUMERIC(10,2),
  is_featured       BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partners' AND policyname = 'partners_public_read'
  ) THEN
    CREATE POLICY "partners_public_read" ON public.partners
      FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_partners_category ON public.partners(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_partners_featured ON public.partners(is_featured) WHERE is_active = TRUE;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.partner_products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  product_url  TEXT,
  category     TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_partner_products_partner ON public.partner_products(partner_id) WHERE is_active = TRUE;

-- ── USER_ROLES (bootstrap if missing; admin policies reference this table) ──
-- Uses TEXT for role so this runs whether or not public.app_role exists elsewhere.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN (
    'admin', 'hr_staff', 'super_admin', 'user', 'staff'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Each user must be able to read their own role rows so EXISTS(...) in admin policies works.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'user_roles_select_own'
  ) THEN
    CREATE POLICY "user_roles_select_own" ON public.user_roles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partner_products' AND policyname = 'partner_products_public_read'
  ) THEN
    CREATE POLICY "partner_products_public_read" ON public.partner_products
      FOR SELECT
      USING (
        is_active = TRUE
        AND EXISTS (
          SELECT 1 FROM public.partners p
          WHERE p.id = partner_products.partner_id AND p.is_active = TRUE
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partner_products' AND policyname = 'partner_products_admin_all'
  ) THEN
    CREATE POLICY "partner_products_admin_all" ON public.partner_products
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partners' AND policyname = 'partners_admin_all'
  ) THEN
    CREATE POLICY "partners_admin_all" ON public.partners
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Seed: The Lotus Group (supplies / sustainable F&B packaging for hotels)
INSERT INTO public.partners (
  slug, name, category, tagline, description, website_url,
  is_featured, is_active, sort_order
)
VALUES (
  'the-lotus-group',
  'The Lotus Group',
  'supplies',
  'Good for the earth, good for us',
  'Sustainable food packaging with custom branding — fiber dinnerware, PLA cups and containers, bags, cutlery, and bulk programs for restaurants, clubs, resorts, and hotel F&B.',
  'https://thelotusgroup.us/',
  TRUE,
  TRUE,
  0
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.partner_products (partner_id, name, description, product_url, category, sort_order)
SELECT p.id, v.name, v.description, v.product_url, v.category, v.sort_order
FROM public.partners p
CROSS JOIN (
  VALUES
    ('Bags & liners', 'Compostable and paper bags, liners, and carry-out solutions for hotel F&B and retail.', 'https://thelotusgroup.us/', 'bags', 1),
    ('Bowls & plates', 'Fiber, palm, and PFAS-conscious dinnerware for banquets, grab-and-go, and room service.', 'https://thelotusgroup.us/', 'dinnerware', 2),
    ('Containers & clamshells', 'Fiber clamshells, deli rounds, salad bowls, and clear PLA options for kitchens.', 'https://thelotusgroup.us/', 'containers', 3),
    ('Cups, lids & straws', 'Cold and hot cups, lids, and straws — including custom printing for your brand.', 'https://thelotusgroup.us/', 'cups', 4),
    ('Cutlery & utensils', 'Compostable cutlery kits and utensils suited for high-volume service.', 'https://thelotusgroup.us/', 'cutlery', 5),
    ('Pizza trays & lids', 'Takeout pizza packaging and lids for delivery and poolside service.', 'https://thelotusgroup.us/', 'pizza', 6),
    ('Bulk & custom programs', 'Bulk ordering, subscribe-and-save style programs, and custom-branded packaging.', 'https://thelotusgroup.us/', 'programs', 7)
) AS v(name, description, product_url, category, sort_order)
WHERE p.slug = 'the-lotus-group'
ON CONFLICT (partner_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  product_url = EXCLUDED.product_url,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;
