export type ExtractedFinancials = {
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  cashFlow?: number;
  healthScore: number;
  reasoning: {
    dataSource: string;
    matches: Array<{ key: string; line: string; value: number }>;
    notes?: string;
  };
};

// Heuristic parser for plain financial text (income statements, cash flow statements, etc.)
export async function extractKeyFinancialsFromText(text: string): Promise<ExtractedFinancials> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Detect global unit hints often present at the top: "(in thousands)"
  const header = text.slice(0, 800).toLowerCase();
  let globalMultiplier = 1;
  if (/\b(in\s+thousands|in\s+000s|in\s*\$?\s*thousands)\b/.test(header)) globalMultiplier = 1_000;
  else if (/\b(in\s+millions)\b/.test(header)) globalMultiplier = 1_000_000;
  else if (/\b(in\s+billions)\b/.test(header)) globalMultiplier = 1_000_000_000;

  const patterns: Array<{ key: 'revenue' | 'expenses' | 'profit' | 'cashflow'; regex: RegExp }> = [
    { key: 'revenue', regex: /(total\s+revenue|net\s+sales|revenues|revenue|sales|turnover)/i },
    { key: 'expenses', regex: /(total\s+expenses|expenses|operating\s+expenses|cost\s+of\s+goods\s+sold|cogs)/i },
    { key: 'profit', regex: /(net\s+(income|profit)|profit\s*(after|before)?\s*tax|net\s*income|net\s*loss)/i },
    { key: 'cashflow', regex: /(cash\s*flow|net\s*cash.*operating\s*activities|operating\s*cash\s*flow|net\s*cash\s*from\s*operations)/i },
  ];

  const matchResults: Record<string, Array<{ line: string; value: number }>> = {
    revenue: [], expenses: [], profit: [], cashflow: []
  };

  // Specific buckets for better expense inference
  const totalExpenseMatches: Array<{ line: string; value: number }> = [];
  const cogsMatches: Array<{ line: string; value: number }> = [];
  const opexMatches: Array<{ line: string; value: number }> = [];

  // Parse a monetary amount with units and negatives, honoring globalMultiplier if no explicit unit
  const parseAmount = (s: string): number | null => {
    if (!s) return null;
    // pick first numeric-like token with optional parentheses, currency, commas, units
    const amountMatch = s.match(/\(?\s*[-+]?\$?\s*\d{1,3}(?:[,.\s]\d{3})*(?:\.\d+)?\s*\)?\s*(million|m|billion|b|thousand|k)?/i);
    if (!amountMatch) return null;
    const raw = amountMatch[0];
    const unit = (amountMatch[1] || '').toLowerCase();
    const negative = /^\(/.test(raw) || /-/.test(raw) || /net\s*loss/i.test(s);
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    let multiplier = 1;
    if (unit === 'k' || unit === 'thousand') multiplier = 1_000;
    else if (unit === 'm' || unit === 'million') multiplier = 1_000_000;
    else if (unit === 'b' || unit === 'billion') multiplier = 1_000_000_000;
    else multiplier = globalMultiplier; // apply header scaling if no explicit unit
    const val = num * multiplier;
    return negative ? -val : val;
  };

  // Scan lines, and if a labeled line has no number, also peek at the next line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Expense sub-categories
    if (/\bcost\s+of\s+goods\s+sold\b|\bcogs\b/i.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) cogsMatches.push({ line, value: v });
    }
    if (/\boperating\s+expenses?\b|\bopex\b/i.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) opexMatches.push({ line, value: v });
    }
    if (/\btotal\s+expenses\b/i.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) totalExpenseMatches.push({ line, value: v });
    }

    for (const p of patterns) {
      if (p.regex.test(line)) {
        let value = parseAmount(line);
        if (value === null && lines[i + 1]) value = parseAmount(lines[i + 1]);
        if (value !== null) matchResults[p.key].push({ line, value });
      }
    }
  }

  // Helper to pick the most plausible amount (largest absolute value)
  const pick = (arr: Array<{ line: string; value: number }>) =>
    arr.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]?.value;

  let revenue = pick(matchResults.revenue) ?? undefined;

  // Prefer explicitly labeled total expenses, else combine COGS + OPEX if available, else fallback
  let expenses: number | undefined = undefined;
  const totalExp = pick(totalExpenseMatches);
  if (typeof totalExp === 'number') {
    expenses = totalExp;
  } else {
    const cogs = pick(cogsMatches);
    const opex = pick(opexMatches);
    if (typeof cogs === 'number' || typeof opex === 'number') {
      expenses = (cogs ?? 0) + (opex ?? 0);
    } else {
      expenses = pick(matchResults.expenses) ?? undefined;
    }
  }

  let profit = pick(matchResults.profit) ?? undefined;
  let cashFlow = pick(matchResults.cashflow) ?? undefined;

  // Do not invent missing values; keep as undefined if not explicitly present
  // Compute health score based on whatever is available
  const healthScore = computeHealthScorePartial({
    revenue,
    expenses,
    cashFlow,
    profit
  });

  const matches: Array<{ key: string; line: string; value: number }> = [];
  for (const key of Object.keys(matchResults)) {
    for (const m of matchResults[key]) matches.push({ key, ...m });
  }
  for (const m of totalExpenseMatches) matches.push({ key: 'total_expenses', ...m });
  for (const m of cogsMatches) matches.push({ key: 'cogs', ...m });
  for (const m of opexMatches) matches.push({ key: 'operating_expenses', ...m });

  return {
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: profit,
    cashFlow: cashFlow,
    healthScore,
    reasoning: {
      dataSource: 'Client-side text parser',
      matches,
      notes: 'Heuristic parser with unit detection, next-line lookup, and expense inference.'
    }
  };
}

export async function extractKeyFinancialsFromTextAggregated(text: string): Promise<ExtractedFinancials> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Detect unit hints at top of doc
  const header = text.slice(0, 800).toLowerCase();
  let globalMultiplier = 1;
  if (/\b(in\s+thousands|in\s+000s|in\s*\$?\s*thousands)\b/.test(header)) globalMultiplier = 1_000;
  else if (/\b(in\s+millions)\b/.test(header)) globalMultiplier = 1_000_000;
  else if (/\b(in\s+billions)\b/.test(header)) globalMultiplier = 1_000_000_000;

  const revRegex = /(total\s+revenue|net\s+sales|revenues|revenue|sales|turnover)/i;
  const expRegex = /(total\s+expenses|expenses|operating\s+expenses|cost\s+of\s+goods\s+sold|cogs)/i;
  const profitRegex = /(net\s+(income|profit)|profit\s*(after|before)?\s*tax|net\s*income|net\s*loss)/i;
  const cashRegex = /(cash\s*flow|net\s*cash.*operating\s*activities|operating\s*cash\s*flow|net\s*cash\s*from\s*operations)/i;

  const totalExpenseRegex = /\btotal\s+expenses\b/i;
  const cogsRegex = /\bcost\s+of\s+goods\s+sold\b|\bcogs\b/i;
  const opexRegex = /\boperating\s+expenses?\b|\bopex\b/i;

  const parseAmount = (s: string): number | null => {
    if (!s) return null;
    const amountMatch = s.match(/\(?\s*[-+]?\$?\s*\d{1,3}(?:[,\.\s]\d{3})*(?:\.\d+)?\s*\)?\s*(million|m|billion|b|thousand|k)?/i);
    if (!amountMatch) return null;
    const raw = amountMatch[0];
    const unit = (amountMatch[1] || '').toLowerCase();
    const negative = /^\(/.test(raw) || /-/.test(raw) || /net\s*loss/i.test(s);
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    let mult = 1;
    if (unit === 'k' || unit === 'thousand') mult = 1_000;
    else if (unit === 'm' || unit === 'million') mult = 1_000_000;
    else if (unit === 'b' || unit === 'billion') mult = 1_000_000_000;
    else mult = globalMultiplier;
    const val = num * mult;
    return negative ? -val : val;
  };

  // Accumulators across the entire document (all pages)
  let revenueSum = 0;
  let totalExpensesSum = 0; // preferred explicit total
  let cogsSum = 0;
  let opexSum = 0;
  let genericExpensesSum = 0;
  let profitSum = 0;
  let cashFlowSum = 0;

  const matches: Array<{ key: string; line: string; value: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Revenue
    if (revRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { revenueSum += v; matches.push({ key: 'revenue', line, value: v }); }
    }

    // Expenses (track explicit total, COGS, OPEX, and generic)
    if (totalExpenseRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { totalExpensesSum += v; matches.push({ key: 'total_expenses', line, value: v }); }
    }
    if (cogsRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { cogsSum += v; matches.push({ key: 'cogs', line, value: v }); }
    }
    if (opexRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { opexSum += v; matches.push({ key: 'operating_expenses', line, value: v }); }
    }
    if (expRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { genericExpensesSum += v; matches.push({ key: 'expenses', line, value: v }); }
    }

    // Profit
    if (profitRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { profitSum += v; matches.push({ key: 'profit', line, value: v }); }
    }

    // Cash Flow
    if (cashRegex.test(line)) {
      const v = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
      if (v !== null) { cashFlowSum += v; matches.push({ key: 'cashflow', line, value: v }); }
    }
  }

  // Decide expense total: prefer explicit totals if present; otherwise COGS+OPEX; otherwise generic
  let expensesTotal: number | undefined = undefined;
  if (Math.abs(totalExpensesSum) > 0) expensesTotal = totalExpensesSum;
  else if (Math.abs(cogsSum) > 0 || Math.abs(opexSum) > 0) expensesTotal = cogsSum + opexSum;
  else if (Math.abs(genericExpensesSum) > 0) expensesTotal = genericExpensesSum;

  // Prefer derived profit from revenue/expenses if both are available
  let profitTotal: number | undefined = undefined;
  if (revenueSum && expensesTotal !== undefined) profitTotal = revenueSum - expensesTotal;
  else if (Math.abs(profitSum) > 0) profitTotal = profitSum;

  const healthScore = computeHealthScorePartial({
    revenue: revenueSum || undefined,
    expenses: expensesTotal,
    cashFlow: cashFlowSum || undefined,
    profit: profitTotal
  });

  return {
    totalRevenue: revenueSum || undefined,
    totalExpenses: expensesTotal,
    netProfit: profitTotal,
    cashFlow: cashFlowSum || undefined,
    healthScore,
    reasoning: {
      dataSource: 'Client-side text parser (aggregated across all pages)',
      matches,
      notes: 'Summed values across the entire document to capture multi-page totals.'
    }
  };
}

function computeHealthScore(revenue: number, expenses: number, cashFlow: number): number {
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 100;
  const cashFlowMargin = revenue > 0 ? (cashFlow / revenue) * 100 : 0;

  let score = 50;
  if (profit > 0) score += 20;
  if (profitMargin > 20) score += 10; else if (profitMargin > 10) score += 5; else if (profitMargin < 0) score -= 10;
  if (cashFlow > 0) score += 15;
  if (cashFlowMargin > 10) score += 10; else if (cashFlowMargin > 5) score += 5;
  if (expenseRatio < 70) score += 10; else if (expenseRatio < 80) score += 5; else if (expenseRatio > 90) score -= 10;
  if (revenue > 50_000) score += 10; else if (revenue > 10_000) score += 5;
  return Math.max(0, Math.min(100, score));
}

// Partial, missing-data tolerant scoring. Scales earned points to a 0-100 range with a 50 baseline.
export function computeHealthScorePartial(params: { revenue?: number; expenses?: number; cashFlow?: number; profit?: number; }): number {
  const { revenue, expenses, cashFlow, profit } = params;

  // Derive profit if missing and we have revenue/expenses
  let p = profit;
  if (p === undefined && revenue !== undefined && expenses !== undefined) {
    p = revenue - expenses;
  }

  // Helpers
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const norm = (v: number, min: number, max: number) => clamp((v - min) / (max - min), 0, 1);

  // Collect metric scores (0-100) with intended weights
  const metrics: Array<{ score: number; weight: number }> = [];

  // Profit margin: 0% -> 0, 35%+ -> 100 (smooth cap to avoid easy 100s)
  if (revenue !== undefined && revenue !== 0 && p !== undefined) {
    const pm = (p / revenue) * 100;
    const pmScore = norm(pm, 0, 35) * 100; // typical excellent ~35%
    metrics.push({ score: pmScore, weight: 0.35 });
  }

  // Expense ratio (lower is better): 90% -> 0, 60% -> ~67, 50% -> 100
  if (revenue !== undefined && revenue !== 0 && expenses !== undefined) {
    const er = (expenses / revenue) * 100;
    const erScore = (1 - norm(er, 60, 90)) * 100; // penalize >90%, reward <60%
    metrics.push({ score: erScore, weight: 0.25 });
  }

  // Cash flow margin: 0% -> 0, 20%+ -> 100
  if (revenue !== undefined && revenue !== 0 && cashFlow !== undefined) {
    const cfm = (cashFlow / revenue) * 100;
    const cfmScore = norm(cfm, 0, 20) * 100;
    metrics.push({ score: cfmScore, weight: 0.25 });
  } else if (cashFlow !== undefined && revenue === undefined) {
    // If revenue missing, modest signal from absolute cash flow
    metrics.push({ score: cashFlow > 0 ? 65 : 35, weight: 0.15 });
  }

  // Revenue scale using log to reduce saturation: 50k -> 0, 1.5M+ -> 100
  if (revenue !== undefined) {
    const revScore = norm(
      Math.log10(Math.max(1, revenue)),
      Math.log10(50_000),
      Math.log10(1_500_000)
    ) * 100;
    metrics.push({ score: revScore, weight: 0.15 });
  }

  // If we have absolutely no info, return neutral 50
  if (metrics.length === 0) return 50;

  // Renormalize weights to sum to 1 for available metrics
  const totalW = metrics.reduce((s, m) => s + m.weight, 0);
  const weighted = metrics.reduce((s, m) => s + m.score * (m.weight / totalW), 0);

  // Slightly pull toward neutral to avoid extreme 100s on modest data
  const blended = 0.9 * weighted + 0.1 * 50;

  return Math.max(0, Math.min(100, Math.round(blended)));
}

// Advanced triple-scan extractor with category awareness and reconciliation
// It runs three passes: (1) direct-key parser, (2) aggregated multi-page parser, (3) category-aware parser.
// Then it reconciles each metric via median voting and sanity checks.
export async function extractKeyFinancialsTripleScan(text: string): Promise<ExtractedFinancials> {
  const pass1 = await extractKeyFinancialsFromText(text);
  const pass2 = await extractKeyFinancialsFromTextAggregated(text);

  // Pass 3: category-aware parser
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const header = text.slice(0, 800).toLowerCase();
  let globalMultiplier = 1;
  if (/(in\s+thousands|in\s+000s|in\s*\$?\s*thousands)/.test(header)) globalMultiplier = 1_000;
  else if (/(in\s+millions)/.test(header)) globalMultiplier = 1_000_000;
  else if (/(in\s+billions)/.test(header)) globalMultiplier = 1_000_000_000;

  const parseAmount = (s: string): number | null => {
    if (!s) return null;
    const m = s.match(/\(?\s*[-+]?\$?\s*\d{1,3}(?:[,\.\s]\d{3})*(?:\.\d+)?\s*\)?\s*(million|m|billion|b|thousand|k)?/i);
    if (!m) return null;
    const raw = m[0];
    const unit = (m[1] || '').toLowerCase();
    const negative = /^\(/.test(raw) || /-/.test(raw) || /net\s*loss/i.test(s);
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    let mult = 1;
    if (unit === 'k' || unit === 'thousand') mult = 1_000;
    else if (unit === 'm' || unit === 'million') mult = 1_000_000;
    else if (unit === 'b' || unit === 'billion') mult = 1_000_000_000;
    else mult = globalMultiplier;
    const val = num * mult;
    return negative ? -val : val;
  };

  // Extended categories
  const regexes = {
    revenue: /(total\s+revenue|net\s+sales|revenues|^revenue$|sales|turnover)/i,
    otherIncome: /(other\s+income|interest\s+income|rental\s+income|grants?)/i,
    returns: /(returns\s*&?\s*allowances)/i,
    discounts: /(discounts?\s+given|sales\s+discounts?)/i,
    cogs: /(cost\s+of\s+goods\s+sold|\bcogs\b)/i,
    opex: /(operating\s+expenses?|\bopex\b|general\s*&\s*administrative|g&a|sg&a|selling\s+.*administrative)/i,
    opexItems: /(salaries|wages|payroll|marketing|advertising|utilities|rent|lease|insurance|office\s+supplies|repairs|maintenance|research|r&d|depreciation|amortization|professional\s+fees|legal|accounting|consulting|travel|entertainment|taxes?\b(?!\s*receivable)|interest\s+expense)/i,
    profit: /(net\s+(income|profit)|net\s*loss)/i,
    ebit: /\bebit\b|earnings\s+before\s+interest\s+and\s+tax/i,
    ebitda: /\bebitda\b|earnings\s+before\s+interest,?\s+taxes,?\s+depreciation,?\s+and\s+amortization/i,
    cashOps: /(cash\s*flow\s*from\s*operations|net\s*cash.*operating\s*activities|operating\s*cash\s*flow)/i,
    freeCashFlow: /(free\s+cash\s+flow|fcf)/i
  };

  let rev = 0, otherInc = 0, returns = 0, discounts = 0;
  let totalExp = 0, cogs = 0, opex = 0, opexItemSum = 0;
  let profit = 0, profitSeen = false;
  let cashOps = 0, fcf = 0;
  const catMatches: Array<{ key: string; line: string; value: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const val = parseAmount(line) ?? parseAmount(lines[i + 1] || '');
    if (val == null) continue;
    if (regexes.revenue.test(line)) { rev += val; catMatches.push({ key: 'revenue', line, value: val }); }
    else if (regexes.otherIncome.test(line)) { otherInc += val; catMatches.push({ key: 'other_income', line, value: val }); }
    else if (regexes.returns.test(line)) { returns += Math.abs(val); catMatches.push({ key: 'returns_allowances', line, value: Math.abs(val) }); }
    else if (regexes.discounts.test(line)) { discounts += Math.abs(val); catMatches.push({ key: 'discounts', line, value: Math.abs(val) }); }
    else if (regexes.cogs.test(line)) { cogs += Math.abs(val); catMatches.push({ key: 'cogs', line, value: Math.abs(val) }); }
    else if (regexes.opex.test(line) || regexes.opexItems.test(line)) { opexItemSum += Math.abs(val); catMatches.push({ key: 'opex_item', line, value: Math.abs(val) }); }
    else if (regexes.profit.test(line)) { profit = val; profitSeen = true; catMatches.push({ key: 'profit', line, value: val }); }
    else if (regexes.ebitda.test(line) || regexes.ebit.test(line)) { /* informational only */ }
    else if (regexes.cashOps.test(line)) { cashOps += val; catMatches.push({ key: 'cash_ops', line, value: val }); }
    else if (regexes.freeCashFlow.test(line)) { fcf += val; catMatches.push({ key: 'free_cash_flow', line, value: val }); }
  }

  if (opexItemSum > 0) opex = opexItemSum;
  totalExp = (cogs || 0) + (opex || 0);
  const revAdj = (rev || 0) + (otherInc || 0) - (returns || 0) - (discounts || 0);
  if (!profitSeen && revAdj && totalExp) profit = revAdj - totalExp;
  const cashChosen = fcf !== 0 ? fcf : cashOps !== 0 ? cashOps : undefined;

  const pass3 = {
    totalRevenue: revAdj || undefined,
    totalExpenses: totalExp || undefined,
    netProfit: profitSeen ? profit : (revAdj && totalExp ? revAdj - totalExp : undefined),
    cashFlow: cashChosen,
    healthScore: computeHealthScorePartial({ revenue: revAdj || undefined, expenses: totalExp || undefined, profit: profitSeen ? profit : undefined, cashFlow: cashChosen }),
    reasoning: {
      dataSource: 'Category-aware parser',
      matches: catMatches,
      notes: 'Adjusted revenue = sales + other income - returns - discounts; expenses = COGS + OPEX (detailed items).'
    }
  } as ExtractedFinancials;

  // Reconcile via median/consistency checks
  const median = (arr: number[]) => { const a = [...arr].sort((x,y)=>x-y); const n=a.length; return n? (n%2? a[(n-1)/2] : (a[n/2-1]+a[n/2])/2): undefined; };
  const vals = {
    revenue: [pass1.totalRevenue, pass2.totalRevenue, pass3.totalRevenue].filter((v): v is number => typeof v === 'number'),
    expenses: [pass1.totalExpenses, pass2.totalExpenses, pass3.totalExpenses].filter((v): v is number => typeof v === 'number'),
    profit: [pass1.netProfit, pass2.netProfit, pass3.netProfit].filter((v): v is number => typeof v === 'number'),
    cash: [pass1.cashFlow, pass2.cashFlow, pass3.cashFlow].filter((v): v is number => typeof v === 'number'),
  };

  let revenue = median(vals.revenue);
  let expenses = median(vals.expenses);
  let profitRec = median(vals.profit);
  let cash = median(vals.cash);

  // Sanity reconciliation: if we have revenue & expenses, prefer profit = rev - exp
  if (typeof revenue === 'number' && typeof expenses === 'number') {
    const derived = revenue - expenses;
    if (typeof profitRec !== 'number' || Math.abs(profitRec - derived) / (Math.abs(derived) + 1) > 0.15) {
      profitRec = derived;
    }
  }

  const healthScore = computeHealthScorePartial({ revenue, expenses, cashFlow: cash, profit: profitRec });

  const scannerVotes = {
    revenue: { pass1: pass1.totalRevenue, pass2: pass2.totalRevenue, pass3: pass3.totalRevenue },
    expenses: { pass1: pass1.totalExpenses, pass2: pass2.totalExpenses, pass3: pass3.totalExpenses },
    profit: { pass1: pass1.netProfit, pass2: pass2.netProfit, pass3: pass3.netProfit },
    cashFlow: { pass1: pass1.cashFlow, pass2: pass2.cashFlow, pass3: pass3.cashFlow },
  } as const;

  return {
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: profitRec,
    cashFlow: cash,
    healthScore,
    reasoning: {
      dataSource: 'Triple-scan reconciliation (text + aggregated + category-aware)',
      matches: [...pass1.reasoning.matches, ...pass2.reasoning.matches, ...pass3.reasoning.matches],
      notes: `Scanner votes -> ${JSON.stringify(scannerVotes)}`
    }
  };
}
