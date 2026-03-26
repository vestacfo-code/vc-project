export type HealthComponents = {
  revenueGrowthRate?: number | null; // percentage
  netProfitMargin?: number | null;   // percentage
  cashFlowStability?: number | null; // 0-100 scale
  operatingExpenseRatio?: number | null; // percentage
};

export type AdvancedAnalysis = {
  metrics: {
    totalRevenue: number | null;
    netProfit: number | null;
    cashFlow: number | null;
    operatingExpenses: number | null;
    businessHealthScore: {
      value: number | null; // 0-100
      rating: 'Poor' | 'Fair' | 'Good' | 'Excellent' | null;
      components: HealthComponents;
    };
  };
  rawExtracted: {
    matches?: Array<any>;
    aiSource?: string;
  };
  supportingData: {
    cogs?: number | null;
    assets?: number | null;
    liabilities?: number | null;
    accountsReceivable?: number | null;
    accountsPayable?: number | null;
    currency?: string | null;
    reportingPeriod?: string | null;
  };
  notes: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toPercent(val: number) {
  // Keep one decimal
  return Math.round(val * 10) / 10;
}

function ratingFor(score: number): 'Poor' | 'Fair' | 'Good' | 'Excellent' {
  if (score <= 40) return 'Poor';
  if (score <= 60) return 'Fair';
  if (score <= 80) return 'Good';
  return 'Excellent';
}

export function computeAdvancedHealthScore(components: HealthComponents): { value: number | null; rating: AdvancedAnalysis['metrics']['businessHealthScore']['rating'] } {
  const present: Array<{ val: number; weight: number }> = [];

  if (components.revenueGrowthRate != null && isFinite(components.revenueGrowthRate)) {
    // Map -100%..+100% to 0..100 with midpoint 50 (no change)
    const norm = clamp((components.revenueGrowthRate + 100) / 200, 0, 1) * 100; // -100% => 0, +100% => 100
    present.push({ val: norm, weight: 0.25 });
  }
  if (components.netProfitMargin != null && isFinite(components.netProfitMargin)) {
    // 0%..35% => 0..100
    const norm = clamp(components.netProfitMargin / 35, 0, 1) * 100;
    present.push({ val: norm, weight: 0.25 });
  }
  if (components.cashFlowStability != null && isFinite(components.cashFlowStability)) {
    // Already 0..100
    const norm = clamp(components.cashFlowStability, 0, 100);
    present.push({ val: norm, weight: 0.25 });
  }
  if (components.operatingExpenseRatio != null && isFinite(components.operatingExpenseRatio)) {
    // Lower is better: 90% => 0, 50% => 100
    const er = components.operatingExpenseRatio;
    const norm = clamp((90 - er) / (90 - 50), 0, 1) * 100;
    present.push({ val: norm, weight: 0.25 });
  }

  if (present.length === 0) return { value: null, rating: null };

  // Renormalize weights
  const totalW = present.reduce((s, x) => s + x.weight, 0);
  const score = present.reduce((s, x) => s + x.val * (x.weight / totalW), 0);
  const finalScore = Math.round(score);
  return { value: finalScore, rating: ratingFor(finalScore) };
}

export function buildAdvancedAnalysis(input: {
  totalRevenue: number | null | undefined;
  totalExpenses: number | null | undefined;
  netProfit: number | null | undefined;
  cashFlow: number | null | undefined;
  operatingExpenses?: number | null | undefined;
  cogs?: number | null | undefined;
  revenueSeries?: number[] | null; // optional for growth
  cashFlowSeries?: number[] | null; // optional for stability
  matches?: Array<any>;
  currencyHint?: string | null;
  reportingPeriodHint?: string | null;
  notes?: string[];
}): AdvancedAnalysis {
  const notes: string[] = [];

  const totalRevenue = (typeof input.totalRevenue === 'number') ? input.totalRevenue : null;
  const totalExpenses = (typeof input.totalExpenses === 'number') ? input.totalExpenses : null;
  let netProfit = (typeof input.netProfit === 'number') ? input.netProfit : null;
  const cashFlow = (typeof input.cashFlow === 'number') ? input.cashFlow : null;

  const cogs = (typeof input.cogs === 'number') ? input.cogs : null;
  let operatingExpenses = (typeof input.operatingExpenses === 'number') ? input.operatingExpenses : null;

  // Derive profit if missing
  if (netProfit == null && totalRevenue != null && totalExpenses != null) {
    netProfit = totalRevenue - totalExpenses;
    notes.push('Derived netProfit = TotalRevenue - TotalExpenses.');
  }

  // Derive OPEX if missing but have total expenses and COGS
  if (operatingExpenses == null && totalExpenses != null && cogs != null) {
    operatingExpenses = totalExpenses - cogs;
    notes.push('Derived OperatingExpenses = TotalExpenses - COGS.');
  }

  // Components
  let revenueGrowthRate: number | null = null;
  if (input.revenueSeries && input.revenueSeries.length >= 2) {
    const first = input.revenueSeries[0];
    const last = input.revenueSeries[input.revenueSeries.length - 1];
    if (first && isFinite(first) && first !== 0) {
      revenueGrowthRate = toPercent(((last - first) / Math.abs(first)) * 100);
      notes.push(`Revenue growth computed from series of ${input.revenueSeries.length} points.`);
    }
  }

  let netProfitMargin: number | null = null;
  if (totalRevenue && netProfit != null && totalRevenue !== 0) {
    netProfitMargin = toPercent((netProfit / totalRevenue) * 100);
    notes.push('Net profit margin = NetProfit / TotalRevenue.');
  }

  let cashFlowStability: number | null = null;
  if (input.cashFlowSeries && input.cashFlowSeries.length >= 2) {
    const arr = input.cashFlowSeries.filter(v => typeof v === 'number' && isFinite(v));
    if (arr.length >= 2) {
      const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
      const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (arr.length - 1);
      const std = Math.sqrt(variance);
      if (mean !== 0) {
        const cv = Math.abs(std / mean); // coefficient of variation
        cashFlowStability = clamp((1 - cv) * 100, 0, 100);
        cashFlowStability = toPercent(cashFlowStability);
        notes.push('Cash flow stability derived from coefficient of variation (std/mean).');
      }
    }
  }

  let operatingExpenseRatio: number | null = null;
  if (operatingExpenses != null && totalRevenue && totalRevenue !== 0) {
    operatingExpenseRatio = toPercent((operatingExpenses / totalRevenue) * 100);
    notes.push('Operating expense ratio = OperatingExpenses / TotalRevenue.');
  }

  const { value, rating } = computeAdvancedHealthScore({
    revenueGrowthRate: revenueGrowthRate ?? undefined,
    netProfitMargin: netProfitMargin ?? undefined,
    cashFlowStability: cashFlowStability ?? undefined,
    operatingExpenseRatio: operatingExpenseRatio ?? undefined,
  });

  // Build JSON result
  const result: AdvancedAnalysis = {
    metrics: {
      totalRevenue,
      netProfit,
      cashFlow,
      operatingExpenses: operatingExpenses ?? null,
      businessHealthScore: {
        value,
        rating,
        components: {
          revenueGrowthRate,
          netProfitMargin,
          cashFlowStability,
          operatingExpenseRatio,
        }
      }
    },
    rawExtracted: {
      matches: input.matches || [],
      aiSource: undefined,
    },
    supportingData: {
      cogs,
      currency: input.currencyHint ?? null,
      reportingPeriod: input.reportingPeriodHint ?? null,
    },
    notes: [...(input.notes || []), ...notes]
  };

  // Replace nulls with explicit placeholders in notes only; keep nulls for machine-readability
  if (result.metrics.totalRevenue == null) result.notes.push('Total Revenue: No Data Provided');
  if (result.metrics.netProfit == null) result.notes.push('Net Profit: No Data Provided');
  if (result.metrics.cashFlow == null) result.notes.push('Cash Flow: No Data Provided');
  if (result.metrics.operatingExpenses == null) result.notes.push('Operating Expenses: No Data Provided');
  if (result.metrics.businessHealthScore.value == null) result.notes.push('Business Health Score: No Data Provided');

  return result;
}
