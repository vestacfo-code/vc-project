// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent, fileName, userId } = await req.json();
    
    console.log(`🎯 CSV FINANCIAL PARSER: ${fileName} for user: ${userId}`);
    
    const parsedData = parseFinancialCSV(csvContent);
    
    return new Response(JSON.stringify({
      success: true,
      ...parsedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('CSV financial parsing error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseFinancialCSV(csvContent: string) {
  console.log('🔍 Parsing financial CSV content...');
  
  const lines = csvContent.trim().split('\n');
  const result = {
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    cashFlow: 0,
    revenueItems: [] as any[],
    expenseItems: [] as any[],
    confidence: 0,
    detectedStructure: 'income_statement',
    processingLog: [] as string[]
  };

  let currentSection = 'unknown';
  let revenueAccumulator = 0;
  let expenseAccumulator = 0;
  let netRevenueFound = false;
  let totalExpensesFound = false;

  console.log(`📄 Processing ${lines.length} lines...`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV row
    const cells = parseCSVRow(line);
    if (cells.length < 2) continue;

    const label = cells[0].toLowerCase().trim();
    let valueStr = '';
    
    // For pipe-separated tables, the value is usually in the second column
    if (cells.length >= 2) {
      valueStr = cells[1].trim();
    }
    
    console.log(`🔍 Line ${i}: Label="${label}" | Value="${valueStr}" | Cells=${JSON.stringify(cells)}`);
    
    result.processingLog.push(`Line ${i}: ${label} = ${valueStr}`);

    // Clean and extract monetary value
    const monetaryValue = extractMonetaryValue(valueStr);
    
    if (monetaryValue === null || monetaryValue === 0) {
      // Check for section headers
      if (label.includes('revenue') || label.includes('income')) {
        currentSection = 'revenue';
        result.processingLog.push(`→ Entering revenue section`);
      } else if (label.includes('expense') || label.includes('cost')) {
        currentSection = 'expenses';
        result.processingLog.push(`→ Entering expense section`);
      } else if (label.includes('operating expense')) {
        currentSection = 'expenses';
        result.processingLog.push(`→ Entering operating expenses section`);
      }
      continue;
    }

    console.log(`💰 Found value: ${label} = $${monetaryValue.toLocaleString()}`);

    // Classify the line item
    if (isRevenueItem(label)) {
      currentSection = 'revenue';
      result.revenueItems.push({ label: cells[0], amount: monetaryValue });
      
      // Handle specific revenue totals
      if (label.includes('net revenue') || label.includes('total revenue')) {
        result.totalRevenue = monetaryValue;
        netRevenueFound = true;
        result.processingLog.push(`✅ Found net revenue: $${monetaryValue.toLocaleString()}`);
      } else {
        revenueAccumulator += monetaryValue;
      }
    } 
    else if (isExpenseItem(label)) {
      currentSection = 'expenses';
      result.expenseItems.push({ label: cells[0], amount: monetaryValue });
      
      // Handle specific expense totals
      if (label.includes('total expense') || label.includes('total operating expense')) {
        result.totalExpenses = monetaryValue;
        totalExpensesFound = true;
        result.processingLog.push(`✅ Found total expenses: $${monetaryValue.toLocaleString()}`);
      } else {
        expenseAccumulator += monetaryValue;
      }
    }
    else if (isProfitItem(label)) {
      result.totalProfit = monetaryValue;
      result.processingLog.push(`✅ Found net profit: $${monetaryValue.toLocaleString()}`);
    }
    else if (currentSection === 'revenue') {
      result.revenueItems.push({ label: cells[0], amount: monetaryValue });
      revenueAccumulator += monetaryValue;
    }
    else if (currentSection === 'expenses') {
      result.expenseItems.push({ label: cells[0], amount: monetaryValue });
      expenseAccumulator += monetaryValue;
    }
  }

  // Use explicit totals if found, otherwise use accumulated values
  if (!netRevenueFound && revenueAccumulator > 0) {
    result.totalRevenue = revenueAccumulator;
    result.processingLog.push(`💰 Calculated total revenue from items: $${revenueAccumulator.toLocaleString()}`);
  }

  if (!totalExpensesFound && expenseAccumulator > 0) {
    result.totalExpenses = expenseAccumulator;
    result.processingLog.push(`💸 Calculated total expenses from items: $${expenseAccumulator.toLocaleString()}`);
  }

  // Verify profit calculation
  const calculatedProfit = result.totalRevenue - result.totalExpenses;
  if (result.totalProfit === 0 && calculatedProfit > 0) {
    result.totalProfit = calculatedProfit;
    result.processingLog.push(`📊 Calculated profit: $${calculatedProfit.toLocaleString()}`);
  }

  // Calculate confidence score
  let confidence = 0;
  if (result.totalRevenue > 0) confidence += 0.4;
  if (result.totalExpenses > 0) confidence += 0.3;
  if (result.totalProfit > 0) confidence += 0.3;
  if (result.revenueItems.length > 0) confidence += 0.1;
  if (result.expenseItems.length > 0) confidence += 0.1;

  result.confidence = Math.min(confidence, 1.0);

  console.log('🎯 FINAL RESULTS:', {
    revenue: result.totalRevenue,
    expenses: result.totalExpenses,
    profit: result.totalProfit,
    confidence: result.confidence,
    revenueItems: result.revenueItems.length,
    expenseItems: result.expenseItems.length
  });

  return result;
}

function parseCSVRow(line: string): string[] {
  const cells = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  
  // If we only got one cell and it contains pipes, it's probably a markdown table row
  if (cells.length === 1 && cells[0].includes('|')) {
    // Split by pipe instead for markdown tables
    return cells[0].split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
  }
  
  return cells;
}

function extractMonetaryValue(str: string): number | null {
  if (!str) return null;
  
  // Handle negative values in parentheses first
  let cleaned = str.trim();
  let isNegative = false;
  
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1);
    isNegative = true;
  }
  
  // Remove $ symbol and any whitespace, but keep commas for proper parsing
  cleaned = cleaned.replace(/^\$/, '').trim();
  
  // Remove commas and parse
  const withoutCommas = cleaned.replace(/,/g, '');
  
  const num = parseFloat(withoutCommas);
  const result = isNaN(num) ? null : (isNegative ? -num : num);
  
  console.log(`💰 Parsing "${str}" -> cleaned: "${cleaned}" -> withoutCommas: "${withoutCommas}" -> result: ${result}`);
  
  return result;
}

function isRevenueItem(label: string): boolean {
  const revenueKeywords = [
    'revenue', 'sales', 'income', 'subscription', 'purchases', 'competition', 
    'referral', 'deals', 'affiliate', 'advertising', 'net revenue',
    'premium subscription', 'in-app purchases', 'sponsored', 'broker', 'brand'
  ];
  return revenueKeywords.some(keyword => label.includes(keyword));
}

function isExpenseItem(label: string): boolean {
  const expenseKeywords = [
    'expense', 'cost', 'wages', 'salary', 'rent', 'office', 'legal', 
    'advertising', 'contract', 'bookkeeping', 'admin', 'software',
    'operating expense', 'cost of services', 'total expense'
  ];
  return expenseKeywords.some(keyword => label.includes(keyword));
}

function isProfitItem(label: string): boolean {
  const profitKeywords = ['net profit', 'profit', 'net income', 'earnings'];
  return profitKeywords.some(keyword => label.includes(keyword));
}