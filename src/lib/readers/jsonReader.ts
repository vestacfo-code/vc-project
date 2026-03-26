import { computeHealthScorePartial } from '../textFinancialExtractor';

export interface JSONReaderResult {
  groqAnalysis: {
    totalRevenue?: number | null;
    totalExpenses?: number | null;
    netProfit?: number | null;
    cashFlow?: number | null;
    healthScore: number;
    reasoning: {
      dataSource: string;
      matches: Array<{ key: string; path: string; value: number }>;
      notes?: string;
      operatingExpenses?: number | null;
    };
  };
  financialRecords: Array<{
    user_id: string;
    period_start: string;
    period_end: string;
    revenue: number;
    expenses: number;
    cash_flow: number;
    profit: number;
  }>;
}

// Key synonyms to improve matching accuracy
const KEY_MAP = {
  revenue: [
    'revenue', 'totalRevenue', 'revenues', 'sales', 'netSales', 'turnover',
    'grossSales', 'totalSales', 'income', 'totalIncome'
  ],
  expenses: [
    'expenses', 'totalExpenses', 'totalOperatingExpenses', 'costs', 'totalCost', 'totalCosts'
  ],
  operatingExpenses: [
    'operatingExpenses', 'opex', 'operating_costs', 'operatingCosts', 'sga', 'sg&a', 'sellingGeneralAdministrative',
    'overhead', 'adminCosts', 'administrativeCosts', 'operatingCosts'
  ],
  netProfit: [
    'netProfit', 'profit', 'netIncome', 'netEarnings', 'earnings', 'netLoss', 'profitAfterTax', 'finalProfit'
  ],
  cashFlow: [
    'cashFlow', 'netCashFlow', 'operatingCashFlow', 'netCashFromOperations', 'endingCash', 'netCash', 'cashMovement', 'cashPosition'
  ],
  date: [ 'date', 'period', 'periodEnd', 'period_end', 'periodDate' ]
} as const;

type KeyType = keyof typeof KEY_MAP;

function keyMatches(key: string, type: KeyType): boolean {
  const k = key.replace(/\s|_|-/g, '').toLowerCase();
  return KEY_MAP[type].some(s => k === s.replace(/\s|_|-/g, '').toLowerCase());
}

function isPlainObject(v: any): v is Record<string, any> {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function toNumber(val: any): number | null {
  if (typeof val === 'number' && isFinite(val)) return val;
  if (typeof val === 'string') {
    const negative = /\(|-/.test(val) && !/\)/.test(val) ? true : /^\(.*\)$/.test(val);
    const cleaned = val.replace(/[^0-9.,-]/g, '').replace(/,(?=\d{3}(\D|$))/g, '').replace(/(\d)[,](\d{2,})$/, '$1.$2');
    const n = parseFloat(cleaned);
    if (!isNaN(n)) return negative ? -n : n;
  }
  return null;
}

function pickBest(values: number[]): number | null {
  if (!values.length) return null;
  // Choose the largest absolute value (avoids partial subtotals)
  return values.sort((a, b) => Math.abs(b) - Math.abs(a))[0];
}

export async function readJSONFinancials(file: File, userId: string): Promise<JSONReaderResult> {
  const text = await file.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON file');
  }

  const matches: Array<{ key: string; path: string; value: number }> = [];
  const found: Record<'revenue'|'expenses'|'operatingExpenses'|'netProfit'|'cashFlow', number[]> = {
    revenue: [], expenses: [], operatingExpenses: [], netProfit: [], cashFlow: []
  };

  // Depth-first traversal to collect numeric values under known keys
  const stack: Array<{ node: any; path: string }>= [{ node: data, path: '$' }];
  while (stack.length) {
    const { node, path } = stack.pop()!;
    if (Array.isArray(node)) {
      node.forEach((item, idx) => stack.push({ node: item, path: `${path}[${idx}]` }));
      continue;
    }
    if (isPlainObject(node)) {
      for (const [k, v] of Object.entries(node)) {
        const childPath = `${path}.${k}`;
        if (isPlainObject(v) || Array.isArray(v)) {
          stack.push({ node: v, path: childPath });
          continue;
        }
        // Try all key types
        for (const type of Object.keys(KEY_MAP) as KeyType[]) {
          if (type === 'date') continue;
          if (keyMatches(k, type)) {
            const num = toNumber(v);
            if (num != null) {
              if (type === 'operatingExpenses') {
                found.operatingExpenses.push(num);
                matches.push({ key: 'operatingExpenses', path: childPath, value: num });
              } else if (type === 'revenue') {
                found.revenue.push(num);
                matches.push({ key: 'revenue', path: childPath, value: num });
              } else if (type === 'expenses') {
                found.expenses.push(num);
                matches.push({ key: 'totalExpenses', path: childPath, value: num });
              } else if (type === 'netProfit') {
                found.netProfit.push(num);
                matches.push({ key: 'netProfit', path: childPath, value: num });
              } else if (type === 'cashFlow') {
                found.cashFlow.push(num);
                matches.push({ key: 'cashFlow', path: childPath, value: num });
              }
            }
          }
        }
      }
    }
  }

  // Prefer values marked as totals in the object paths
  const fromMatches = (k: string) => matches.filter(m => m.key === k);
  const preferTotals = (arr: { path: string; value: number }[]) => {
    const totals = arr.filter(a => /total|grand\s*total/i.test(a.path));
    const source = totals.length ? totals : arr;
    if (!source.length) return null;
    return source.map(a => a.value).sort((a,b)=>Math.abs(b)-Math.abs(a))[0];
  };

  const totalRevenue = preferTotals(fromMatches('revenue')) ?? pickBest(found.revenue);
  let totalExpenses = preferTotals(fromMatches('totalExpenses')) ?? pickBest(found.expenses);
  const operatingExpenses = pickBest(found.operatingExpenses);
  if (totalExpenses == null && operatingExpenses != null) totalExpenses = operatingExpenses;
  const netProfit = preferTotals(fromMatches('netProfit')) ?? pickBest(found.netProfit);
  const cashFlow = preferTotals(fromMatches('cashFlow')) ?? pickBest(found.cashFlow);

  const healthScore = computeHealthScorePartial({
    revenue: totalRevenue ?? undefined,
    expenses: totalExpenses ?? undefined,
    cashFlow: cashFlow ?? undefined,
    profit: netProfit ?? undefined,
  });

  const today = new Date().toISOString().split('T')[0];
  const record = {
    user_id: userId,
    period_start: today,
    period_end: today,
    revenue: totalRevenue ?? 0,
    expenses: totalExpenses ?? 0,
    cash_flow: cashFlow ?? 0,
    profit: (totalRevenue != null && totalExpenses != null) ? (totalRevenue - totalExpenses) : (netProfit ?? 0),
  } as const;

  return {
    groqAnalysis: {
      totalRevenue: totalRevenue ?? null,
      totalExpenses: totalExpenses ?? null,
      netProfit: (record.profit ?? null),
      cashFlow: cashFlow ?? null,
      healthScore,
      reasoning: {
        dataSource: 'Dedicated JSON reader',
        matches,
        notes: 'Parsed with key-synonym matching and numeric normalization.',
        operatingExpenses: operatingExpenses ?? null,
      }
    },
    financialRecords: [record]
  };
}
