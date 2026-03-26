export type BusinessModel = 'SaaS' | 'Services' | 'Ecommerce' | 'Marketplace' | 'BrickAndMortar' | 'Other';

export interface ValuationInputs {
  model: BusinessModel;
  currency: string;
  // Common
  ttmRevenue?: number;
  growth_3m_pct?: number;
  growth_12m_pct?: number;
  conc_top5_pct?: number;
  // SaaS
  arr?: number;
  mrr?: number;
  gross_margin_pct?: number;
  churn_logo_pct?: number;
  churn_revenue_pct?: number;
  ndr_pct?: number; // Net Dollar Retention
  arpu?: number;
  ltv?: number;
  cac?: number;
  ebitda?: number;
  // Services / Brick
  sde?: number;
  owner_dependence_slider?: number; // 0-10
  // Ecommerce
  inventory_value?: number;
  channel_risk_slider?: number; // 0-10
  // Marketplace
  gmv?: number;
  take_rate_pct?: number;
}

export interface ValuationResult {
  method: string;
  low: number;
  base: number;
  high: number;
  drivers: string[];
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const round10k = (n: number) => Math.round((n || 0) / 10000) * 10000;

export function computeValuation(inputs: ValuationInputs): ValuationResult {
  const features = {
    scale: Math.log10((inputs.arr || inputs.ttmRevenue || 1) as number),
    growth12: inputs.growth_12m_pct ?? 0,
    gmargin: inputs.gross_margin_pct ?? 0,
    churn_logo: inputs.churn_logo_pct ?? 0,
    churn_rev: inputs.churn_revenue_pct ?? 0,
    ndr: inputs.ndr_pct ?? 100,
    sde: inputs.sde ?? 0,
    ebitda: inputs.ebitda ?? 0,
    inventory: inputs.inventory_value ?? 0,
    conc_top5: inputs.conc_top5_pct ?? 0,
    owner_dependence: inputs.owner_dependence_slider ?? 0,
    channel_risk: inputs.channel_risk_slider ?? 0,
  };

  let low = 0, base = 0, high = 0;
  let method = '';
  const drivers: string[] = [];

  if (inputs.model === 'SaaS') {
    method = inputs.arr ? 'ARR multiple' : 'Revenue multiple';
    const ARR = inputs.arr ?? inputs.ttmRevenue ?? 0;
    let baseMultiple = 1.8;
    baseMultiple += clamp((features.growth12 / 100) * 2.0, -0.5, 3.0);
    baseMultiple += clamp(((features.ndr - 100) / 100) * 1.5, -0.5, 2.0);
    baseMultiple += clamp(((features.gmargin - 60) / 100) * 0.8, -0.5, 1.0);
    baseMultiple += clamp((-features.churn_logo / 100) * 1.0, -2.0, 0);
    baseMultiple += clamp(features.scale * 0.6, 0, 1.2);
    baseMultiple += clamp((-features.conc_top5 / 100) * 1.0, -1.0, 0);

    low = Math.max(0.8, baseMultiple - 0.8);
    high = baseMultiple + 0.8;

    low = round10k(ARR * low);
    base = round10k(ARR * baseMultiple);
    high = round10k(ARR * high);

    // drivers
    if (features.growth12) drivers.push(`Growth 12m: ${features.growth12}%`);
    if (inputs.ndr_pct) drivers.push(`NDR: ${inputs.ndr_pct}%`);
    if (inputs.gross_margin_pct) drivers.push(`Gross margin: ${inputs.gross_margin_pct}%`);
    if (features.conc_top5) drivers.push(`Top-5 concentration: ${features.conc_top5}%`);
  } else if (inputs.model === 'Services' || inputs.model === 'BrickAndMortar') {
    method = 'SDE multiple';
    const SDE = inputs.sde ?? 0;
    let sdeMultiple = 2.4;
    sdeMultiple += clamp((features.growth12 / 100) * 0.8, -0.6, 0.8);
    sdeMultiple += clamp(-(features.owner_dependence / 10) * 0.7, -0.7, 0);
    sdeMultiple += clamp(-(features.conc_top5 / 100) * 0.7, -0.7, 0);

    low = Math.max(1.2, sdeMultiple - 0.7);
    high = sdeMultiple + 0.7;

    low = round10k(SDE * low);
    base = round10k(SDE * sdeMultiple);
    high = round10k(SDE * high);

    if (inputs.sde) drivers.push(`SDE level`);
    if (features.growth12) drivers.push(`Growth 12m: ${features.growth12}%`);
    drivers.push(`Owner dependence: ${features.owner_dependence}/10`);
  } else if (inputs.model === 'Ecommerce') {
    method = 'SDE multiple + inventory';
    const SDE = inputs.sde ?? 0;
    let sdeMultiple = 2.6;
    sdeMultiple += clamp(((features.gmargin - 40) / 100) * 0.8, -0.6, 0.8);
    sdeMultiple += clamp(-(features.channel_risk / 10) * 0.6, -0.6, 0);

    const lowMult = Math.max(1.5, sdeMultiple - 0.8);
    const highMult = sdeMultiple + 0.8;

    const core = {
      low: SDE * lowMult,
      base: SDE * sdeMultiple,
      high: SDE * highMult,
    };

    low = round10k(core.low + features.inventory);
    base = round10k(core.base + features.inventory);
    high = round10k(core.high + features.inventory);

    if (inputs.gross_margin_pct) drivers.push(`Gross margin: ${inputs.gross_margin_pct}%`);
    if (features.inventory) drivers.push(`Inventory included`);
    drivers.push(`Channel risk: ${features.channel_risk}/10`);
  } else if (inputs.model === 'Marketplace') {
    method = 'Revenue multiple (GMV x take rate)';
    const rev = (inputs.gmv ?? 0) * ((inputs.take_rate_pct ?? 0) / 100);
    let revMultiple = 1.8;
    revMultiple += clamp((features.growth12 / 100) * 1.0, -0.6, 1.2);
    revMultiple += clamp(-(features.conc_top5 / 100) * 0.7, -0.7, 0);

    const lowMult = Math.max(0.9, revMultiple - 0.7);
    const highMult = revMultiple + 0.7;

    low = round10k(rev * lowMult);
    base = round10k(rev * revMultiple);
    high = round10k(rev * highMult);

    if (inputs.take_rate_pct) drivers.push(`Take rate: ${inputs.take_rate_pct}%`);
    if (features.growth12) drivers.push(`Growth 12m: ${features.growth12}%`);
    if (features.conc_top5) drivers.push(`Top-5 concentration: ${features.conc_top5}%`);
  } else {
    // Fallback: revenue multiple
    method = 'Revenue multiple (fallback)';
    const rev = inputs.ttmRevenue ?? 0;
    const multiple = 1.2;
    low = round10k(rev * Math.max(0.6, multiple - 0.4));
    base = round10k(rev * multiple);
    high = round10k(rev * (multiple + 0.4));
  }

  return { method, low, base, high, drivers };
}
