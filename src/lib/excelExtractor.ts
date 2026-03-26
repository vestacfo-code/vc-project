import * as XLSX from 'xlsx';
import { extractKeyFinancialsFromText, computeHealthScorePartial } from './textFinancialExtractor';

export type ExcelExtraction = {
  groqAnalysis: {
    totalRevenue?: number | null;
    totalExpenses?: number | null;
    netProfit?: number | null;
    cashFlow?: number | null;
    cogs?: number | null;
    operatingExpenses?: number | null;
    healthScore: number;
    reasoning: {
      dataSource: string;
      matches: Array<{ key: string; label: string; value: number }>;
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
};

function parseAmount(val: any, globalMultiplier: number): { num: number | null; explicit: boolean } {
  if (val == null) return { num: null, explicit: false };
  // Numeric cell
  if (typeof val === 'number' && isFinite(val)) return { num: val * (globalMultiplier || 1), explicit: false };
  if (typeof val !== 'string') return { num: null, explicit: false };
  const s = val.trim();
  if (!s) return { num: null, explicit: false };
  const unitMatch = s.toLowerCase().match(/(million|\bm\b|billion|\bb\b|thousand|\bk\b)(?![a-z])/i);
  const negative = /^\(/.test(s) || /-/.test(s) || /net\s*loss/i.test(s);
  const cleaned = s.replace(/[^0-9.,]/g, '')
                   .replace(/,(?=\d{3}(\D|$))/g, '')
                   .replace(/(\d)[,](\d{2,})$/, '$1.$2');
  const base = parseFloat(cleaned);
  if (isNaN(base)) return { num: null, explicit: false };
  let mult = 1;
  const u = unitMatch?.[1]?.toLowerCase();
  if (u === 'k' || u === 'thousand') mult = 1_000;
  else if (u === 'm' || u === 'million') mult = 1_000_000;
  else if (u === 'b' || u === 'billion') mult = 1_000_000_000;
  else mult = globalMultiplier || 1;
  let num = base * mult;
  if (negative) num = -num;
  return { num, explicit: !!unitMatch };
}

function normalize(str: string) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

const headerSynonyms = {
  revenue: [
    /total\s*revenue/,
    /net\s*sales/,
    /revenues?/,
    /^revenue$/,
    /\bsales\b/,
    /\bgross\s*sales\b/,
    /\btotal\s*sales\b/,
    /turnover/,
    /gross\s*receipts/
  ],
  expensesTotal: [/total\s*expenses?/, /total\s*operating\s*expenses?/, /total\s*costs?/, /overall\s*expenses?/],
  cogs: [/(cost\s*of\s*goods\s*sold|\bcogs\b|\bcost\s*of\s*sales\b)/],
  opex: [/(operating\s*expenses?|\bopex\b|selling.*general.*administrative|sg&a|sga|general\s*&\s*administrative|g&a|overhead|admin(istrative)?\s*costs?|operating\s*costs?)/],
  profit: [/net\s*(income|profit)/, /^profit$/, /(profit\s*after\s*tax|pat)/, /net\s*loss/, /\bnet\s*earnings\b/, /\bearnings\b/, /\bfinal\s*profit\b/],
  cashflow: [/(cash\s*flow|net\s*cash(?!\s*equivalents)|operating\s*cash\s*flow|net\s*cash\s*from\s*operations|cash\s*from\s*operations|ending\s*cash|cash\s*position|cash\s*movement)/]
};

function findColIndex(headers: string[], patterns: RegExp[]): number | null {
  for (let i = 0; i < headers.length; i++) {
    const h = normalize(String(headers[i] ?? ''));
    if (!h) continue;
    if (patterns.some(r => r.test(h))) return i;
  }
  return null;
}

// Heuristics to filter out ratio/percentage rows that should not be treated as totals
function isRatioLikeLabel(label: string): boolean {
  const l = normalize(label);
  return /%(\s|$)|percentage|percent|margin|growth|rate|ratio|per\s*share|%\s*of|as\s*a\s*%|of\s+revenue(\s*%|\s*of)?|return\s+on|debt\s+to|coverage|efficiency|turnover\s+ratio|current\s+ratio|quick\s+ratio|leverage|multiple/i.test(l);
}

function isPercentCell(val: any): boolean {
  if (typeof val === 'string') return /%/.test(val);
  return false;
}

function isPercentishValue(val: any): boolean {
  if (isPercentCell(val)) return true;
  if (typeof val === 'number') {
    // More strict: consider values between 0-1 as potential percentages only if they're not large amounts
    return Math.abs(val) > 0 && Math.abs(val) <= 1 && val !== Math.floor(val);
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    // Exclude obvious monetary values
    if (/\$|usd|eur|gbp|k\b|m\b|b\b|thousand|million|billion|,\d{3}/.test(s)) return false;
    // Check for percentage indicators
    if (/%|percent/i.test(s)) return true;
    const num = parseFloat(s.replace(/[^0-9.\-]/g, ''));
    // More conservative: only flag as percentage if it's a small decimal AND has percentage context
    return isFinite(num) && Math.abs(num) > 0 && Math.abs(num) <= 1 && 
           (s.includes('%') || /margin|rate|ratio|growth|return/i.test(s));
  }
  return false;
}

function unitNameFromMultiplier(mult: number): 'raw' | 'thousands' | 'millions' | 'billions' {
  if (mult === 1_000) return 'thousands';
  if (mult === 1_000_000) return 'millions';
  if (mult === 1_000_000_000) return 'billions';
  return 'raw';
}

function isPercentColumn(rows: any[][], colIdx: number, headerRowIdx: number, sampleLimit = 30): boolean {
  let checked = 0; let percentish = 0; let hasPercentSymbol = 0;
  
  // Check column header for percentage indicators
  const header = String(rows[headerRowIdx]?.[colIdx] || '').toLowerCase();
  if (/%|percent|margin|rate|ratio|growth/i.test(header)) {
    return true;
  }
  
  for (let r = headerRowIdx + 1; r < rows.length && checked < sampleLimit; r++) {
    const cell = rows[r]?.[colIdx];
    if (cell == null || cell === '') continue;
    checked++;
    
    if (typeof cell === 'string' && cell.includes('%')) {
      hasPercentSymbol++;
    }
    
    if (isPercentishValue(cell)) percentish++;
  }
  
  if (checked === 0) return false;
  
  // More strict criteria: need explicit % symbols OR very high ratio of percentage-like values
  return hasPercentSymbol > 0 || (percentish / checked >= 0.8);
}

function aggregateCandidates(vals: Array<{label: string; val: number}>): number | null {
  if (!vals.length) return null;
  const totals = vals.filter(v => /total|grand\s*total/i.test(normalize(v.label)));
  if (totals.length) {
    return totals.sort((a,b)=>Math.abs(b.val)-Math.abs(a.val))[0].val;
  }
  const sumPos = vals.filter(v => typeof v.val === 'number' && v.val > 0).reduce((s,v)=> s + v.val, 0);
  if (sumPos > 0) return sumPos;
  // fallback to largest magnitude
  return vals.sort((a,b)=>Math.abs(b.val)-Math.abs(a.val))[0].val;
}

function detectGlobalMultiplier(rows: any[][]): number {
  // Look in the first few rows for unit hints like "(in thousands)"
  const top = rows.slice(0, 10).map(r => r.map(c => String(c ?? '')).join(' ')).join(' ').toLowerCase();
  if (/(in\s+thousands|in\s+000s|in\s*\$?\s*thousands|usd\s+thousands|thousands\s+of\s+\$)/.test(top)) return 1_000;
  if (/(in\s+millions|usd\s+millions)/.test(top)) return 1_000_000;
  if (/(in\s+billions|usd\s+billions)/.test(top)) return 1_000_000_000;
  return 1;
}

export async function extractFinancialsFromExcel(file: File, userId: string): Promise<ExcelExtraction> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });

  let totalRevenue: number | null = null;
  let totalExpenses: number | null = null;
  let netProfit: number | null = null;
  let cashFlow: number | null = null;
  const matches: Array<{ key: string; label: string; value: number }> = [];
  // Track sub-categories to expose five main categories (revenue, COGS, OPEX, profit, cashFlow)
  let cogsTotal: number | null = null;
  let opexTotal: number | null = null;

const today = new Date().toISOString().split('T')[0];
let chosenSheetName = '';
let modeUsed: 'Tabular' | 'Statement' | '' = '';
let selectedSheetScore = 0;
// Tracking for UI reasoning
let runExcludedRows: Array<{label: string; reason: string; value?: any}> = [];
let runDetectedUnit: 'raw' | 'thousands' | 'millions' | 'billions' = 'raw';
let runPeriodColUsedHeader: string | null = null;
let runPercentColumnsSkipped = 0;
let bestExcludedRows: Array<{label: string; reason: string; value?: any}> = [];
let bestDetectedUnit: 'raw' | 'thousands' | 'millions' | 'billions' = 'raw';
let bestPeriodColUsedHeader: string | null = null;
let bestPercentColumnsSkipped = 0;

const tryTabularMode = (sheet: XLSX.WorkSheet, sheetName: string) => {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  if (!rows || rows.length === 0) return false;

  const globalMultiplier = detectGlobalMultiplier(rows);
  // track per-run context
  runExcludedRows = [];
  runDetectedUnit = unitNameFromMultiplier(globalMultiplier);

  // Find header row: prefer a row with multiple strings or with key labels
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i] || [];
    const rowStr = (r.map((c: any) => String(c || '')).join(' | ')).toLowerCase();
    const looksLikeHeader = r.filter(c => typeof c === 'string').length >= 2 || /(revenue|sales|expenses|profit|cash flow)/i.test(rowStr);
    if (looksLikeHeader) { headerRowIdx = i; break; }
  }

  const headers = (rows[headerRowIdx] || []).map((h: any) => String(h || ''));

  // Detect if the header row is period-like (dates/years) after first label column
  const isDateLike = (s: string) => /\b(20\d{2}|19\d{2})\b/.test(s) || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(s) || /\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/.test(s);
  const periodCols: number[] = [];
  for (let c = 1; c < headers.length; c++) {
    if (isDateLike(headers[c])) periodCols.push(c);
  }

  const revCol = findColIndex(headers, headerSynonyms.revenue);
  const totalExpCol = findColIndex(headers, headerSynonyms.expensesTotal);
  const cogsCol = findColIndex(headers, headerSynonyms.cogs);
  const opexCol = findColIndex(headers, headerSynonyms.opex);
  const profCol = findColIndex(headers, headerSynonyms.profit);
  const cfCol  = findColIndex(headers, headerSynonyms.cashflow);

  if (periodCols.length > 0) {
    let selectedCol = periodCols[periodCols.length - 1];
    runPercentColumnsSkipped = 0;
    // Walk backwards to find the last non-percent period column
    for (let i = periodCols.length - 1; i >= 0; i--) {
      const cidx = periodCols[i];
      if (isPercentColumn(rows, cidx, headerRowIdx)) {
        runPercentColumnsSkipped++;
        continue;
      }
      selectedCol = cidx;
      break;
    }
    runPeriodColUsedHeader = String(headers[selectedCol] ?? '');

    // Candidates with preference for TOTAL rows
    const pick = (vals: Array<{label: string; val: number}>) => {
      const totals = vals.filter(v => /total|grand\s*total/i.test(v.label));
      const source = totals.length ? totals : vals;
      if (!source.length) return null;
      return source.sort((a,b)=>Math.abs(b.val)-Math.abs(a.val))[0].val;
    };

    const revVals: Array<{label: string; val: number}> = [];
    const expVals: Array<{label: string; val: number}> = [];
    const cogsVals: Array<{label: string; val: number}> = [];
    const opexVals: Array<{label: string; val: number}> = [];
    const profVals: Array<{label: string; val: number}> = [];
    const cfVals:  Array<{label: string; val: number}> = [];

for (let r = headerRowIdx + 1; r < rows.length; r++) {
  const row = rows[r] || [];
  const rawLabel = String(row[0] ?? '');
  const label = normalize(rawLabel);
  const rawValCell = row[selectedCol];
  const percentCell = isPercentCell(rawValCell);
  if (isRatioLikeLabel(rawLabel) || percentCell) {
    runExcludedRows.push({ label: rawLabel, reason: percentCell ? 'percentage cell' : 'ratio-like label', value: rawValCell });
    continue;
  }
  const { num } = parseAmount(rawValCell, globalMultiplier);
  if (num == null) continue;

  if (headerSynonyms.revenue.some(rx => rx.test(label))) { revVals.push({ label: rawLabel, val: num }); matches.push({ key: 'revenue', label: rawLabel, value: num }); }
  if (headerSynonyms.expensesTotal.some(rx => rx.test(label))) { expVals.push({ label: rawLabel, val: num }); matches.push({ key: 'total_expenses', label: rawLabel, value: num }); }
  if (headerSynonyms.cogs.some(rx => rx.test(label))) { cogsVals.push({ label: rawLabel, val: num }); matches.push({ key: 'cogs', label: rawLabel, value: num }); }
  if (headerSynonyms.opex.some(rx => rx.test(label))) { opexVals.push({ label: rawLabel, val: num }); matches.push({ key: 'operating_expenses', label: rawLabel, value: num }); }
  if (headerSynonyms.profit.some(rx => rx.test(label))) { profVals.push({ label: rawLabel, val: num }); matches.push({ key: 'profit', label: rawLabel, value: num }); }
  if (headerSynonyms.cashflow.some(rx => rx.test(label))) { cfVals.push({ label: rawLabel, val: num }); matches.push({ key: 'cashflow', label: rawLabel, value: num }); }
}

const rev = pick(revVals);
const exp = pick(expVals);
const cogs = pick(cogsVals);
const opex = pick(opexVals);
const prof = pick(profVals);
const cf   = pick(cfVals);

    if (rev != null) totalRevenue = (totalRevenue ?? 0) + rev;
    if (cf  != null) cashFlow = (cashFlow ?? 0) + cf;
    if (prof!= null) netProfit = (netProfit ?? 0) + prof;
    if (cogs!= null) cogsTotal = (cogsTotal ?? 0) + cogs;
    if (opex!= null) opexTotal = (opexTotal ?? 0) + opex;

    let expCombined: number | null = null;
    if (exp != null) expCombined = exp;
    else if (cogs != null || opex != null) expCombined = (cogs ?? 0) + (opex ?? 0);
    if (expCombined != null) totalExpenses = (totalExpenses ?? 0) + expCombined;

    return (totalRevenue != null || totalExpenses != null || netProfit != null || cashFlow != null);
  }

  // No period columns: prefer TOTAL row for revenue/expenses columns, avoid summing entire columns blindly
  const findTotalRowIdx = () => {
    for (let r = rows.length - 1; r > headerRowIdx; r--) {
      const label = normalize(String(rows[r]?.[0] ?? ''));
      if (/total|grand\s*total/.test(label)) return r;
    }
    return -1;
  };

  const totalRowIdx = findTotalRowIdx();

  const getFromCol = (col: number | null): number | null => {
    if (col == null) return null;
    if (totalRowIdx !== -1) {
      const { num } = parseAmount(rows[totalRowIdx]?.[col], globalMultiplier);
      return num ?? null;
    }
    // As a very last resort, pick the largest magnitude in the column to avoid double counting
    let best: number | null = null;
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const { num } = parseAmount(rows[r]?.[col], globalMultiplier);
      if (num == null) continue;
      if (best == null || Math.abs(num) > Math.abs(best)) best = num;
    }
    return best;
  };

  const revVal = getFromCol(revCol);
  const expVal = getFromCol(totalExpCol);
  const cogsVal = getFromCol(cogsCol);
  const opexVal = getFromCol(opexCol);
  const profVal = getFromCol(profCol);
  const cfVal = getFromCol(cfCol);

  if (revVal != null) { totalRevenue = (totalRevenue ?? 0) + revVal; matches.push({ key: 'revenue', label: headers[revCol!], value: revVal }); }
  if (expVal != null) { totalExpenses = (totalExpenses ?? 0) + expVal; matches.push({ key: 'total_expenses', label: headers[totalExpCol!], value: expVal }); }
  if (cogsVal != null) { cogsTotal = (cogsTotal ?? 0) + cogsVal; matches.push({ key: 'cogs', label: headers[cogsCol!], value: cogsVal }); }
  if (opexVal != null) { opexTotal = (opexTotal ?? 0) + opexVal; matches.push({ key: 'operating_expenses', label: headers[opexCol!], value: opexVal }); }
  if (profVal != null) { netProfit = (netProfit ?? 0) + profVal; matches.push({ key: 'profit', label: headers[profCol!], value: profVal }); }
  if (cfVal != null) { cashFlow = (cashFlow ?? 0) + cfVal; matches.push({ key: 'cashflow', label: headers[cfCol!], value: cfVal }); }

  return (revVal != null || expVal != null || profVal != null || cfVal != null || cogsVal != null || opexVal != null);
};

const tryStatementMode = (sheet: XLSX.WorkSheet, sheetName: string) => {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  if (!rows || rows.length === 0) return false;

const globalMultiplier = detectGlobalMultiplier(rows);
// track per-run context
runExcludedRows = [];
runDetectedUnit = unitNameFromMultiplier(globalMultiplier);


  // Assume first column has labels, choose the last numeric column as the latest period
  const colCount = Math.max(...rows.map(r => r.length));
  let lastNumericCol = -1;
  for (let c = colCount - 1; c >= 1; c--) {
    if (rows.some(r => parseAmount(r[c], globalMultiplier).num != null)) { lastNumericCol = c; break; }
  }
  if (lastNumericCol === -1) return false;

  // Build candidates per metric; prefer TOTAL rows
  const pick = (vals: Array<{label: string; val: number}>) => {
    const totals = vals.filter(v => /total|grand\s*total/i.test(v.label));
    const source = totals.length ? totals : vals;
    if (!source.length) return null;
    return source.sort((a,b)=>Math.abs(b.val)-Math.abs(a.val))[0].val;
  };

  const revVals: Array<{label: string; val: number}> = [];
  const expVals: Array<{label: string; val: number}> = [];
  const cogsVals: Array<{label: string; val: number}> = [];
  const opexVals: Array<{label: string; val: number}> = [];
  const profVals: Array<{label: string; val: number}> = [];
  const cfVals:  Array<{label: string; val: number}> = [];

for (const row of rows) {
  const rawLabel = String(row[0] ?? '');
  const label = normalize(rawLabel);
  const rawValCell = row[lastNumericCol];
  const percentCell = isPercentCell(rawValCell);
  if (isRatioLikeLabel(rawLabel) || percentCell) {
    runExcludedRows.push({ label: rawLabel, reason: percentCell ? 'percentage cell' : 'ratio-like label', value: rawValCell });
    continue;
  }
  const { num: val } = parseAmount(rawValCell, globalMultiplier);
  if (val == null) continue;

  if (headerSynonyms.revenue.some(r => r.test(label))) { revVals.push({ label: rawLabel, val: val }); matches.push({ key: 'revenue', label: rawLabel, value: val }); }
  if (headerSynonyms.expensesTotal.some(r => r.test(label))) { expVals.push({ label: rawLabel, val: val }); matches.push({ key: 'total_expenses', label: rawLabel, value: val }); }
  if (headerSynonyms.cogs.some(r => r.test(label))) { cogsVals.push({ label: rawLabel, val: val }); matches.push({ key: 'cogs', label: rawLabel, value: val }); }
  if (headerSynonyms.opex.some(r => r.test(label))) { opexVals.push({ label: rawLabel, val: val }); matches.push({ key: 'operating_expenses', label: rawLabel, value: val }); }
  if (headerSynonyms.profit.some(r => r.test(label))) { profVals.push({ label: rawLabel, val: val }); matches.push({ key: 'profit', label: rawLabel, value: val }); }
  if (headerSynonyms.cashflow.some(r => r.test(label))) { cfVals.push({ label: rawLabel, val: val }); matches.push({ key: 'cashflow', label: rawLabel, value: val }); }
}

  const rev = pick(revVals);
  const exp = pick(expVals);
  const cogs = pick(cogsVals);
  const opex = pick(opexVals);
  const prof = pick(profVals);
  const cf   = pick(cfVals);

  if (rev != null) totalRevenue = (totalRevenue ?? 0) + rev;
  if (cf  != null) cashFlow = (cashFlow ?? 0) + cf;
  if (prof!= null) netProfit = (netProfit ?? 0) + prof;
  if (cogs!= null) cogsTotal = (cogsTotal ?? 0) + cogs;
  if (opex!= null) opexTotal = (opexTotal ?? 0) + opex;

  let expCombined: number | null = null;
  if (exp != null) expCombined = exp;
  else if (cogs != null || opex != null) expCombined = (cogs ?? 0) + (opex ?? 0);
  if (expCombined != null) totalExpenses = (totalExpenses ?? 0) + expCombined;

  return (totalRevenue != null || totalExpenses != null || netProfit != null || cashFlow != null);
};

  // Helper to count how many key metrics are present
  const countPresent = () => {
    let c = 0;
    if (totalRevenue != null) c++;
    if (totalExpenses != null) c++;
    if (netProfit != null) c++;
    if (cashFlow != null) c++;
    if (cogsTotal != null) c++;
    if (opexTotal != null) c++;
    return c;
  };
  const clearState = () => {
    totalRevenue = null; totalExpenses = null; netProfit = null; cashFlow = null; cogsTotal = null; opexTotal = null; matches.splice(0, matches.length);
  };

  // Pass 1: evaluate each sheet in Tabular mode and pick the best (no cross-sheet summing)
  let bestScore = -1;
  let bestSnapshot: any = null;
  let bestMatches: Array<{ key: string; label: string; value: number }> = [];
  let bestSheet = '';
  let bestMode: 'Tabular' | 'Statement' | '' = '';

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    clearState();
    tryTabularMode(sheet, sheetName);
    const score = countPresent() * 100 + matches.length; // prioritize metrics, break ties with matches
    if (score > bestScore) {
      bestScore = score;
      bestSnapshot = { totalRevenue, totalExpenses, netProfit, cashFlow, cogsTotal, opexTotal };
      bestMatches = matches.slice();
      bestSheet = sheetName;
      bestMode = 'Tabular';
      bestExcludedRows = runExcludedRows.slice();
      bestDetectedUnit = runDetectedUnit;
      bestPeriodColUsedHeader = runPeriodColUsedHeader;
      bestPercentColumnsSkipped = runPercentColumnsSkipped;
    }
  }

  // If tabular produced nothing useful, try Statement mode similarly
  if (bestScore <= 0) {
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      clearState();
      tryStatementMode(sheet, sheetName);
      const score = countPresent() * 100 + matches.length;
        if (score > bestScore) {
          bestScore = score;
          bestSnapshot = { totalRevenue, totalExpenses, netProfit, cashFlow, cogsTotal, opexTotal };
          bestMatches = matches.slice();
          bestSheet = sheetName;
          bestMode = 'Statement';
          bestExcludedRows = runExcludedRows.slice();
          bestDetectedUnit = runDetectedUnit;
          bestPeriodColUsedHeader = null;
          bestPercentColumnsSkipped = 0;
        }
    }
  }

  // Restore best selection to global state
  if (bestSnapshot) {
    totalRevenue = bestSnapshot.totalRevenue;
    totalExpenses = bestSnapshot.totalExpenses;
    netProfit = bestSnapshot.netProfit;
    cashFlow = bestSnapshot.cashFlow;
    cogsTotal = bestSnapshot.cogsTotal;
    opexTotal = bestSnapshot.opexTotal;
    matches.splice(0, matches.length, ...bestMatches);
    chosenSheetName = bestSheet;
    modeUsed = bestMode;
    selectedSheetScore = bestScore;
    console.log('[ExcelParser] Selected sheet:', { bestSheet, bestMode, bestScore, totals: { totalRevenue, totalExpenses, netProfit, cashFlow, cogsTotal, opexTotal } });
  }

  // Pass 2: Fallback to heuristic text parser using concatenated CSV from all sheets
  if (totalRevenue == null && totalExpenses == null && netProfit == null && cashFlow == null) {
    let combinedText = '';
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      combinedText += `\n# ${sheetName}\n`;
      combinedText += XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    }
    // Use advanced triple-scan reconciliation for better accuracy on messy spreadsheets
    const { extractKeyFinancialsTripleScan } = await import('./textFinancialExtractor');
    const extracted = await extractKeyFinancialsTripleScan(combinedText);
    totalRevenue = extracted.totalRevenue ?? null;
    totalExpenses = extracted.totalExpenses ?? null;
    netProfit = extracted.netProfit ?? null;
    cashFlow = extracted.cashFlow ?? null;
    const hs = extracted.healthScore;
    // Derive COGS and OPEX from extracted matches when available
    const cogsFromMatches = Array.isArray((extracted as any).reasoning?.matches)
      ? (extracted as any).reasoning.matches.filter((m: any) => m.key === 'cogs').reduce((s: number, m: any) => s + (m.value || 0), 0)
      : null;
    const opexFromMatches = Array.isArray((extracted as any).reasoning?.matches)
      ? (extracted as any).reasoning.matches.filter((m: any) => m.key === 'operating_expenses').reduce((s: number, m: any) => s + (m.value || 0), 0)
      : null;
    const groqAnalysis = {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashFlow,
      cogs: (cogsFromMatches != null && Math.abs(cogsFromMatches) > 0) ? cogsFromMatches : null,
      operatingExpenses: (opexFromMatches != null && Math.abs(opexFromMatches) > 0) ? opexFromMatches : null,
      healthScore: hs,
      reasoning: {
        dataSource: 'Excel heuristic text fallback (triple-scan)',
        matches,
        selectedSheetName: null,
        modeUsed: null,
        selectedSheetScore: 0,
        notes: extracted.reasoning?.notes
      }
    };
    const rec = {
      user_id: userId,
      period_start: today,
      period_end: today,
      revenue: totalRevenue ?? 0,
      expenses: totalExpenses ?? 0,
      cash_flow: cashFlow ?? 0,
      profit: netProfit ?? 0
    } as any;
    return { groqAnalysis, financialRecords: [rec] };
  }

  // Compute health using partial score
  const hs = computeHealthScorePartial({
    revenue: totalRevenue ?? undefined,
    expenses: totalExpenses ?? undefined,
    cashFlow: cashFlow ?? undefined,
    profit: (totalRevenue != null && totalExpenses != null) ? (totalRevenue - totalExpenses) : (netProfit ?? undefined)
  });

  // Prefer deterministic profit when possible
  const profitUsed = (totalRevenue != null && totalExpenses != null) ? (totalRevenue - totalExpenses) : (netProfit ?? null);

  const groqAnalysis = {
    totalRevenue,
    totalExpenses,
    netProfit: profitUsed,
    cashFlow,
    cogs: cogsTotal ?? null,
    operatingExpenses: opexTotal ?? null,
    healthScore: hs,
      reasoning: {
        dataSource: 'Client-side Excel parser',
        matches,
        selectedSheetName: chosenSheetName || null,
        modeUsed: modeUsed || null,
        selectedSheetScore,
        detectedUnit: bestDetectedUnit,
        excludedRows: bestExcludedRows,
        periodColumnUsedHeader: bestPeriodColUsedHeader,
        percentColumnsSkipped: bestPercentColumnsSkipped,
        notes: `Selected sheet: ${chosenSheetName || 'n/a'} (mode: ${modeUsed || 'n/a'}, score: ${selectedSheetScore}). Parsed with SheetJS. Category mappings -> Revenue: Sales/Total Sales/Gross Sales/Turnover/Gross Receipts; Net Profit: Net Income/Profit After Tax/Earnings/Final Profit; Operating Expenses: OPEX/Overhead/Admin Costs/Operating Costs; Cash Flow: Ending Cash/Net Cash/Cash Movement/Cash Position.`
      }
  };

  const record = {
    user_id: userId,
    period_start: today,
    period_end: today,
    revenue: totalRevenue ?? 0,
    expenses: totalExpenses ?? 0,
    cash_flow: cashFlow ?? 0,
    profit: profitUsed ?? 0
  } as any;

  return { groqAnalysis, financialRecords: [record] };
}
