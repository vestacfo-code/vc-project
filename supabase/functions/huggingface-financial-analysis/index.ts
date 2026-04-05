// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced PDF text extraction function
function extractTextFromPDF(pdfBytes: Uint8Array): string {
  // Try multiple encoding approaches
  const decoders = [
    new TextDecoder('utf-8'),
    new TextDecoder('latin1'),
    new TextDecoder('ascii'),
    new TextDecoder('utf-16')
  ];
  
  let bestText = '';
  let maxReadableChars = 0;
  
  for (const decoder of decoders) {
    try {
      const pdfStr = decoder.decode(pdfBytes);
      let text = '';
      
      // Method 1: Extract text objects with improved regex
      const textPatterns = [
        /\(((?:[^()\\]|\\.|\\[0-7]{1,3})*)\)\s*(?:Tj|TJ)/g,
        /\[((?:[^\[\]\\]|\\.|\\[0-7]{1,3})*)\]\s*TJ/g,
        /BT\s*(.*?)\s*ET/gs,
        /\/F\d+\s+[\d.]+\s+Tf\s*(.*?)(?=\/F\d+|BT|ET|$)/gs
      ];
      
      textPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(pdfStr)) !== null) {
          let content = match[1];
          if (content) {
            // Clean up the content
            content = content
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\(.)/g, '$1')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (content.length > 2 && /[a-zA-Z]/.test(content)) {
              text += content + ' ';
            }
          }
        }
      });
      
      // Method 2: Extract from decompressed streams
      const streamRegex = /stream\s*(.*?)\s*endstream/gs;
      const streamMatches = pdfStr.match(streamRegex);
      
      if (streamMatches) {
        streamMatches.forEach(match => {
          const streamContent = match.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
          
          // Look for text that looks like financial data
          const financialChunks = streamContent.match(/[A-Za-z][A-Za-z\s]*[\$\d,.%]+|[\$\d,.%]+[A-Za-z\s]*/g);
          if (financialChunks) {
            financialChunks.forEach(chunk => {
              if (chunk.length > 3 && (/\$/.test(chunk) || /\d/.test(chunk))) {
                text += chunk + ' ';
              }
            });
          }
          
          // Extract readable words
          const words = streamContent.match(/[A-Za-z]{3,}/g);
          if (words) {
            text += words.join(' ') + ' ';
          }
        });
      }
      
      // Method 3: Direct financial pattern extraction from entire PDF
      const directPatterns = [
        /(?:revenue|sales|income|gross|total|profit|loss|expenses?|costs?|cash\s*flow)[\s:]*\$?[\d,.]+[kmb]?/gi,
        /\$[\s]*[\d,.]+(?:[kmb](?:illion)?)?/gi,
        /[\d,.]+\s*(?:million|thousand|billion)/gi,
        /(?:Q[1-4]|FY|fiscal\s*year)\s*[\d]{4}[\s:]*\$?[\d,.]+/gi
      ];
      
      directPatterns.forEach(pattern => {
        const matches = pdfStr.match(pattern);
        if (matches) {
          text += ' ' + matches.join(' ') + ' ';
        }
      });
      
      // Count readable characters
      const readableChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
      
      if (readableChars > maxReadableChars) {
        maxReadableChars = readableChars;
        bestText = text;
      }
      
    } catch (e) {
      console.log(`Decoder ${decoder.encoding} failed:`, e);
    }
  }
  
  return bestText.replace(/\s+/g, ' ').trim();
}

// Calculate health score based on financial metrics
function calculateHealthScore(revenue: number, expenses: number, profit: number): number {
  let score = 50; // Base score
  
  if (revenue <= 0) return 25; // No revenue is concerning
  
  const profitMargin = (profit / revenue) * 100;
  const expenseRatio = (expenses / revenue) * 100;
  
  // Profit margin scoring
  if (profitMargin > 25) score += 30;
  else if (profitMargin > 15) score += 25;
  else if (profitMargin > 10) score += 20;
  else if (profitMargin > 5) score += 10;
  else if (profitMargin > 0) score += 5;
  else score -= 20; // Negative profit
  
  // Expense ratio scoring
  if (expenseRatio < 60) score += 15;
  else if (expenseRatio < 70) score += 10;
  else if (expenseRatio < 80) score += 5;
  else if (expenseRatio > 95) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

// Simple financial data extraction using regex patterns
function extractFinancialData(text: string) {
  console.log('🔍 Extracting financial data from text...');

  // Patterns (more specific first)
  const revenuePatterns = [
    /(?:total\s+revenue|net\s+sales|total\s+sales|revenue|sales|income|turnover)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const totalExpensePatterns = [
    /(?:total\s+expenses?)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const cogsPatterns = [
    /(?:cost\s*of\s*goods\s*sold|cogs)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const opexPatterns = [
    /(?:operating\s*expenses?|opex)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const otherExpensePatterns = [
    /(?:expenses?|costs?|expenditure|administrative\s*expenses?)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const netProfitPatterns = [
    /(?:net\s*(?:profit|income|earnings))[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const profitPatterns = [
    /(?:profit|income|earnings)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  const cashFlowPatterns = [
    /(?:cash\s*flow|net\s*cash)[\s:$]*?\$?([\d,.]+)(?:\s*(k|m|b|thousand|million|billion))?/gi,
  ];

  function toNumber(numStr: string, unit?: string): number {
    const n = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(n)) return 0;
    const u = (unit || '').toLowerCase();
    if (u === 'k' || u === 'thousand') return n * 1_000;
    if (u === 'm' || u === 'million') return n * 1_000_000;
    if (u === 'b' || u === 'billion') return n * 1_000_000_000;
    return n;
  }

  function extract(patterns: RegExp[]): number[] {
    const out: number[] = [];
    for (const p of patterns) {
      const matches = [...text.matchAll(p)];
      for (const m of matches) out.push(toNumber(m[1], m[2]));
    }
    return out.filter(v => !isNaN(v) && v > 0);
  }

  const revenues = extract(revenuePatterns);
  const totalsExp = extract(totalExpensePatterns);
  const cogs = extract(cogsPatterns);
  const opex = extract(opexPatterns);
  const otherExp = extract(otherExpensePatterns);
  const netProfits = extract(netProfitPatterns);
  const profitsAny = extract(profitPatterns);
  const cashFlows = extract(cashFlowPatterns);

  console.log('📊 Extracted:', { revenues, cogs, opex, otherExp, totalsExp, netProfits, profitsAny, cashFlows });

  // Determine totals
  const totalRevenue = revenues.length > 0 ? Math.max(...revenues) : 0;

  // Prefer explicit total expenses; otherwise sum COGS + OPEX; otherwise use max of generic expenses
  let totalExpenses = 0;
  if (totalsExp.length > 0) totalExpenses = Math.max(...totalsExp);
  else if (cogs.length > 0 || opex.length > 0) totalExpenses = (cogs[0] || 0) + (opex[0] || 0);
  else if (otherExp.length > 0) totalExpenses = Math.max(...otherExp);

  // Prefer explicitly labeled net profit; fall back to any profit that is NOT labeled gross (already filtered) or computed
  let netProfit = 0;
  if (netProfits.length > 0) netProfit = Math.max(...netProfits);
  else if (profitsAny.length > 0) netProfit = Math.max(...profitsAny);
  else netProfit = totalRevenue - totalExpenses;

  const cashFlow = cashFlows.length > 0 ? Math.max(...cashFlows) : netProfit;

  // Health score
  const healthScore = calculateHealthScore(totalRevenue, totalExpenses, netProfit);

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    cashFlow,
    healthScore,
    reasoning: {
      dataSource: "Text pattern matching (Word/PDF)",
      confidence: totalRevenue > 0 ? "medium" : "low",
      notes: `COGS=${cogs[0] || 0}, OPEX=${opex[0] || 0}, TOTAL_EXP_USED=${totalExpenses}`
    }
  };
}

serve(sentryServe("huggingface-financial-analysis", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== HUGGING FACE FINANCIAL ANALYSIS START ===');
    
    const { pdfBase64, fileName, extractedText, manualData } = await req.json();
    console.log('📄 Processing:', fileName);
    
    let textToAnalyze = '';
    
    if (manualData) {
      // Handle manual financial data input
      console.log('📊 Processing manual financial data:', manualData);
      
      // Return the manual data with enhanced analysis
      return new Response(JSON.stringify({
        totalRevenue: manualData.revenue || 0,
        totalExpenses: manualData.expenses || 0,
        netProfit: manualData.profit || 0,
        cashFlow: manualData.cashFlow || 0,
        healthScore: calculateHealthScore(manualData.revenue || 0, manualData.expenses || 0, manualData.profit || 0),
        reasoning: {
          dataSource: "Manual user input",
          confidence: "high",
          notes: "Financial data manually entered by user - highest accuracy"
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else if (extractedText) {
      // Handle pre-extracted text from client-side PDF processing
      console.log('📝 Using pre-extracted text, length:', extractedText.length);
      console.log('📝 Sample text:', extractedText.substring(0, 500));
      textToAnalyze = extractedText;
      
    } else if (pdfBase64) {
      // Fallback: Extract text from PDF (legacy support)
      console.log('🔍 Extracting text from PDF bytes...');
      const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      textToAnalyze = extractTextFromPDF(pdfBytes);
      
      console.log('📝 Extracted text length:', textToAnalyze.length);
      console.log('📝 Sample text:', textToAnalyze.substring(0, 500));
    } else {
      return new Response(JSON.stringify({ 
        error: 'Missing required data',
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashFlow: 0,
        healthScore: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (textToAnalyze.length < 20) {
      console.log('⚠️ Insufficient text extracted, using pattern-based analysis');
      return new Response(JSON.stringify({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashFlow: 0,
        healthScore: 15,
        reasoning: {
          dataSource: "PDF extraction failed",
          confidence: "very low",
          notes: `Could not extract readable text from "${fileName}". Please ensure PDF contains searchable text.`
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Try pattern-based extraction first
    const patternResult = extractFinancialData(textToAnalyze);
    
    if (patternResult.totalRevenue > 0 || patternResult.totalExpenses > 0) {
      console.log('✅ Pattern-based extraction successful');
      return new Response(JSON.stringify(patternResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // No external AI fallback. Do not invent values.
    console.log('ℹ️ No reliable figures extracted; returning null metrics with explanatory notes');
    return new Response(JSON.stringify({
      totalRevenue: null,
      totalExpenses: null,
      netProfit: null,
      cashFlow: null,
      healthScore: 0,
      reasoning: {
        dataSource: "Pattern-based extraction (no reliable values)",
        confidence: "low",
        notes: `No reliable financial figures found in "${fileName}"; returning nulls per policy (No Data Provided).`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      cashFlow: 0,
      healthScore: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));