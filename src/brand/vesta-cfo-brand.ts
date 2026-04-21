/**
 * Vesta CFO — brand & product copy aligned with docs/AI_CFO_Dev_Plan_v2.pdf (March 2026).
 * Use these constants on marketing pages; keep Stripe/legacy tiers in app checkout only.
 */

export const VESTA_PRODUCT_NAME = 'Vesta CFO';
export const VESTA_TAGLINE = 'AI financial intelligence for hotels';

/** Primary SaaS model from PDF §1 Stream 1 */
export const VESTA_SAAS_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$299',
    priceDetail: '/month',
    audience: '1–2 properties',
    description: 'Independent hotels getting a single connected view of performance.',
    features: [
      'Core metrics dashboard (RevPAR, ADR, occupancy, GOPPAR, channel mix)',
      'Daily AI briefing & plain-English summaries',
      'Revenue, labor, and F&B anomaly alerts',
      'One PMS integration (Mews, Cloudbeds, Opera, etc., where supported)',
      'Email notifications',
    ],
    cta: 'Start onboarding',
    ctaHref: '/auth',
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$799',
    priceDetail: '/month per property',
    audience: '3–15 properties',
    description: 'Multi-property operators who need benchmarking and deeper automation.',
    features: [
      'Everything in Starter',
      'Competitive benchmarking & compset-style context',
      'Forecasting & scenario support',
      'Multi-PMS and expanded data sources',
      'AI Cost Cutter partner recommendations (marketplace)',
      'Portfolio-style rollups across properties',
    ],
    cta: 'Talk to us',
    ctaHref: '/contact',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceDetail: 'from ~$2,000/mo',
    audience: '15+ properties or complex stacks',
    description: 'White-glove rollout, SLAs, and integrations your IT team expects.',
    features: [
      'Dedicated onboarding & account support',
      'Custom integrations & APIs',
      'SLA, security review, and procurement-friendly terms',
      'Advanced reporting & executive rollups',
      'Partner marketplace at scale',
    ],
    cta: 'Contact sales',
    ctaHref: 'https://calendly.com/chandaksvar/30min',
    external: true,
    highlight: false,
  },
] as const;

/** Short list for landing page snapshot (links to /pricing for detail) */
export const VESTA_LANDING_PRICING_SNAPSHOT = [
  {
    name: 'Starter',
    price: '$299',
    detail: '/mo · 1–2 properties',
    bullets: ['Dashboard & AI summary', 'Anomaly alerts', '1 PMS integration'],
    to: '/pricing',
    cta: 'See plans',
  },
  {
    name: 'Growth',
    price: '$799',
    detail: '/mo per property · 3–15',
    bullets: ['Benchmarking & forecasting', 'Multi-PMS', 'Partner savings'],
    to: '/pricing',
    cta: 'Compare',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    detail: '15+ properties · from ~$2K/mo',
    bullets: ['SLA & custom integrations', 'Dedicated support', 'Portfolio rollups'],
    to: '/contact',
    cta: 'Contact',
  },
] as const;

export const VESTA_BRAND_COLORS = {
  navy: '#1B3A5C',
  navyMuted: '#2E6DA4',
  gold: '#C8963E',
  cream: '#F7F4EE',
  mist: '#D6E8F2',
} as const;

export const VESTA_VOICE = {
  headline: 'Direct, calm, operator-first — no generic SMB accounting language.',
  avoid: ['generic small-business bookkeeping', 'unlimited AI credits as the hero value'],
  prefer: ['RevPAR', 'GOPPAR', 'PMS', 'anomaly', 'partner marketplace', 'independent hotels'],
} as const;
