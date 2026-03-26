import { computeHealthScorePartial } from '../textFinancialExtractor';

export interface XMLReaderResult {
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

// Synonyms aligned with JSON reader to stay consistent
const KEY_MAP: Record<'revenue'|'expenses'|'netProfit'|'cashFlow', readonly string[]> = {
  revenue: ['revenue', 'totalrevenue', 'revenues', 'sales', 'netsales', 'turnover', 'grosssales', 'totalsales', 'income', 'totalincome'],
  expenses: ['expenses', 'totalexpenses', 'totaloperatingexpenses', 'costs', 'totalcost', 'totalcosts'],
  netProfit: ['netprofit', 'profit', 'netincome', 'netearnings', 'earnings', 'netloss', 'profitaftertax', 'finalprofit'],
  cashFlow: ['cashflow', 'netcashflow', 'operatingcashflow', 'netcashfromoperations', 'endingcash', 'netcash', 'cashmovement', 'cashposition'],
};

function normalizeKey(k: string) {
  return k.replace(/\s|_|-/g, '').toLowerCase();
}

function toNumber(val: any): number | null {
  if (typeof val === 'number' && isFinite(val)) return val;
  if (typeof val === 'string') {
    const negative = /^\(.*\)$/.test(val) || /-/.test(val) || /net\s*loss/i.test(val);
    const cleaned = val
      .replace(/[^0-9.,-]/g, '')
      .replace(/,(?=\d{3}(\D|$))/g, '')
      .replace(/(\d)[,](\d{2,})$/, '$1.$2');
    const n = parseFloat(cleaned);
    if (!isNaN(n)) return negative ? -n : n;
  }
  return null;
}

export async function readXMLFinancials(file: File, userId: string): Promise<XMLReaderResult> {
  const text = await file.text();
  let xml: Document;
  try {
    const parser = new DOMParser();
    xml = parser.parseFromString(text, 'application/xml');
    const parseError = xml.getElementsByTagName('parsererror')[0];
    if (parseError) throw new Error('Invalid XML file');
  } catch (e) {
    throw new Error('Invalid XML file');
  }

  const matches: Array<{ key: string; path: string; value: number }> = [];
  const found: Record<'revenue'|'expenses'|'netProfit'|'cashFlow', number[]> = {
    revenue: [], expenses: [], netProfit: [], cashFlow: []
  };

  // Traverse all elements and attributes
  const walker = (node: Element, path: string) => {
    // Element name as key
    const name = normalizeKey(node.tagName);
    const textContent = (node.textContent || '').trim();

    // Check the element's own name + text
    const tryRecord = (label: string, valueStr: string) => {
      const v = toNumber(valueStr);
      if (v == null) return;
      if (KEY_MAP.revenue.includes(label)) { found.revenue.push(v); matches.push({ key: 'revenue', path, value: v }); }
      if (KEY_MAP.expenses.includes(label)) { found.expenses.push(v); matches.push({ key: 'totalExpenses', path, value: v }); }
      if (KEY_MAP.netProfit.includes(label)) { found.netProfit.push(v); matches.push({ key: 'netProfit', path, value: v }); }
      if (KEY_MAP.cashFlow.includes(label)) { found.cashFlow.push(v); matches.push({ key: 'cashFlow', path, value: v }); }
    };

    tryRecord(name, textContent);

    // Check attributes too (e.g., <amount type="revenue" value="123" />)
    for (const attr of Array.from(node.attributes || [])) {
      const attrName = normalizeKey(attr.name);
      const attrVal = attr.value;
      // when attribute name looks like a label, value may be the number (or vice versa)
      tryRecord(attrName, attrVal);
      const asNumber = toNumber(attrVal);
      if (asNumber != null) tryRecord(name, attrVal);
    }

    // Recurse
    for (const child of Array.from(node.children)) {
      walker(child as Element, `${path}/${(child as Element).tagName}`);
    }
  };

  for (const root of Array.from(xml.childNodes)) {
    if ((root as any).nodeType === 1) walker(root as Element, `/${(root as Element).tagName}`);
  }

  const pickBest = (arr: number[]) => arr.length ? arr.sort((a,b)=>Math.abs(b)-Math.abs(a))[0] : null;

  const totalRevenue = pickBest(found.revenue);
  const totalExpenses = pickBest(found.expenses);
  const netProfit = pickBest(found.netProfit);
  const cashFlow = pickBest(found.cashFlow);

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
      netProfit: record.profit ?? null,
      cashFlow: cashFlow ?? null,
      healthScore,
      reasoning: {
        dataSource: 'Dedicated XML reader',
        matches,
        notes: 'Traversed elements and attributes; normalized numbers and synonyms.'
      }
    },
    financialRecords: [record]
  };
}
