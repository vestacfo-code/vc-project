-- Break RLS infinite recursion between organizations <-> hotels:
-- org_select joined hotels → hotels_select queried organizations → org_select again.
-- SECURITY DEFINER reads bypass RLS for these checks only.

CREATE OR REPLACE FUNCTION public.is_organization_owner(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = _org_id
      AND o.owner_user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hotel_members hm
    JOIN public.hotels h ON h.id = hm.hotel_id
    WHERE h.organization_id = _org_id
      AND hm.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_organization_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_belongs_to_organization(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_organization(uuid) TO authenticated;

-- organizations
DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    (SELECT auth.uid()) = owner_user_id
    OR public.user_belongs_to_organization(id)
  );

-- hotels (remove direct subqueries on organizations)
DROP POLICY IF EXISTS "hotels_select" ON public.hotels;
DROP POLICY IF EXISTS "hotels_insert" ON public.hotels;
DROP POLICY IF EXISTS "hotels_update" ON public.hotels;

CREATE POLICY "hotels_select" ON public.hotels
  FOR SELECT USING (
    (SELECT auth.uid()) IN (
      SELECT hm.user_id FROM public.hotel_members hm
      WHERE hm.hotel_id = hotels.id
    )
    OR public.is_organization_owner(organization_id)
  );

CREATE POLICY "hotels_insert" ON public.hotels
  FOR INSERT WITH CHECK (public.is_organization_owner(organization_id));

CREATE POLICY "hotels_update" ON public.hotels
  FOR UPDATE USING (
    public.is_organization_owner(organization_id)
    OR (SELECT auth.uid()) IN (
      SELECT hm.user_id FROM public.hotel_members hm
      WHERE hm.hotel_id = hotels.id AND hm.role IN ('owner', 'manager')
    )
  );

-- hotel_members (org-owner branch previously scanned organizations → recursion)
DROP POLICY IF EXISTS "members_insert" ON public.hotel_members;
CREATE POLICY "members_insert" ON public.hotel_members
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT hm.user_id FROM public.hotel_members hm
      WHERE hm.hotel_id = hotel_members.hotel_id AND hm.role IN ('owner', 'manager')
    )
    OR public.is_organization_owner(
      (SELECT h.organization_id FROM public.hotels h WHERE h.id = hotel_members.hotel_id)
    )
  );
