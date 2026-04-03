import type { Database } from '@/integrations/supabase/types';

type PartnerRow = Database['public']['Tables']['partners']['Row'];
type ProductRow = Database['public']['Tables']['partner_products']['Row'];

/** Shown when Supabase has no rows or the request fails (e.g. local dev without migration). */
export const FALLBACK_PARTNER_ID = '00000000-0000-0000-0000-000000000001';

export const fallbackPartners: PartnerRow[] = [
  {
    id: FALLBACK_PARTNER_ID,
    slug: 'the-lotus-group',
    name: 'The Lotus Group',
    category: 'supplies',
    tagline: 'Good for the earth, good for us',
    description:
      'Sustainable food packaging with custom branding — fiber dinnerware, PLA cups and containers, bags, cutlery, and bulk programs for restaurants, clubs, resorts, and hotel F&B. Source: thelotusgroup.us',
    logo_url: null,
    website_url: 'https://thelotusgroup.us/',
    avg_savings_pct: null,
    avg_savings_label: null,
    commission_type: 'referral',
    commission_value: null,
    is_featured: true,
    is_active: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const fallbackPartnerProducts: ProductRow[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Bags & liners',
    description: 'Compostable and paper bags, liners, and carry-out solutions for hotel F&B and retail.',
    product_url: 'https://thelotusgroup.us/',
    category: 'bags',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Bowls & plates',
    description: 'Fiber, palm, and PFAS-conscious dinnerware for banquets, grab-and-go, and room service.',
    product_url: 'https://thelotusgroup.us/',
    category: 'dinnerware',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Containers & clamshells',
    description: 'Fiber clamshells, deli rounds, salad bowls, and clear PLA options for kitchens.',
    product_url: 'https://thelotusgroup.us/',
    category: 'containers',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Cups, lids & straws',
    description: 'Cold and hot cups, lids, and straws — including custom printing for your brand.',
    product_url: 'https://thelotusgroup.us/',
    category: 'cups',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Cutlery & utensils',
    description: 'Compostable cutlery kits and utensils suited for high-volume service.',
    product_url: 'https://thelotusgroup.us/',
    category: 'cutlery',
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000106',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Pizza trays & lids',
    description: 'Takeout pizza packaging and lids for delivery and poolside service.',
    product_url: 'https://thelotusgroup.us/',
    category: 'pizza',
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000107',
    partner_id: FALLBACK_PARTNER_ID,
    name: 'Bulk & custom programs',
    description: 'Bulk ordering, subscribe-and-save style programs, and custom-branded packaging.',
    product_url: 'https://thelotusgroup.us/',
    category: 'programs',
    sort_order: 7,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export type PartnerWithProducts = PartnerRow & { products: ProductRow[] };

export function buildFallbackCatalog(): PartnerWithProducts[] {
  return fallbackPartners.map((p) => ({
    ...p,
    products: fallbackPartnerProducts.filter((pr) => pr.partner_id === p.id),
  }));
}
