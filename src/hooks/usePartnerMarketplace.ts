import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildFallbackCatalog, type PartnerWithProducts } from '@/lib/partners/fallback-catalog';

async function fetchPartnerCatalog(): Promise<{ rows: PartnerWithProducts[]; isFallback: boolean }> {
  try {
    const { data: partners, error: pe } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (pe) throw pe;

    const { data: products, error: prE } = await supabase
      .from('partner_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const productList = prE ? [] : (products ?? []);

    if (!partners?.length) {
      if (import.meta.env.DEV) {
        console.warn(
          '[partner marketplace] No active rows in public.partners — using fallback catalog. Run migrations (including partner seed) on this Supabase project.'
        );
      }
      return { rows: buildFallbackCatalog(), isFallback: true };
    }

    const list: PartnerWithProducts[] = partners.map((p) => ({
      ...p,
      products: productList.filter((x) => x.partner_id === p.id),
    }));

    return { rows: list, isFallback: false };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[partner marketplace] Supabase fetch failed — using fallback catalog:', e);
    }
    return { rows: buildFallbackCatalog(), isFallback: true };
  }
}

export function usePartnerMarketplace() {
  return useQuery({
    queryKey: ['partner_marketplace_v1'],
    queryFn: fetchPartnerCatalog,
    staleTime: 60_000,
  });
}
