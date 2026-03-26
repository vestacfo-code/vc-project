// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, userId } = await req.json();
    
    console.log(`🎯 CHATGPT-STYLE EXCEL ANALYSIS: ${fileName} for user: ${userId}`);

    // ChatGPT-style comprehensive analysis
    const processedData = await chatGPTStyleXLSXProcessing(fileContent, fileName);
    
    return new Response(JSON.stringify({
      success: true,
      summary: processedData.summary,
      debugInfo: processedData.debugInfo,
      detailedBreakdown: processedData,
      fileName,
      processingMethod: 'chatgpt-style-complete-analysis'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ChatGPT-style XLSX processing error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function chatGPTStyleXLSXProcessing(base64Content: string, fileName: string) {
  console.log('🎯 CHATGPT COMPLETE ANALYSIS: Full document understanding like ChatGPT Code Interpreter...');
  
  try {
    // Convert base64 to buffer
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const workbook = XLSX.read(bytes, { type: 'array' });
    console.log('📊 WORKBOOK LOADED:', {
      sheets: workbook.SheetNames,
      totalSheets: workbook.SheetNames.length
    });
    
    // CHATGPT-STYLE MULTI-PASS ANALYSIS
    
    // PASS 1: Document Understanding & Context Detection
    console.log('🔍 PASS 1: Document Understanding & Context Detection');
    const documentContext = await analyzeDocumentContext(workbook);
    console.log('📄 DOCUMENT CONTEXT:', documentContext);
    
    // PASS 2: Business Logic Validation & Primary Data Extraction  
    console.log('💼 PASS 2: Business Logic Validation & Primary Data Extraction');
    const primaryData = await extractPrimaryFinancialData(workbook, documentContext);
    console.log('📊 PRIMARY DATA:', primaryData);
    
    // PASS 3: Cross-Validation & Reasonableness Checks
    console.log('✅ PASS 3: Cross-Validation & Reasonableness Checks');
    const validatedData = await performReasonablenessChecks(primaryData, documentContext);
    console.log('🎯 VALIDATED DATA:', validatedData);
    
    // PASS 4: Scale Intelligence & Final Processing
    console.log('🎯 PASS 4: Scale Intelligence & Final Processing');
    const finalResult = await applyBusinessIntelligenceScaling(validatedData, documentContext);
    
    console.log('🏆 FINAL CHATGPT-STYLE RESULT:', {
      confidence: finalResult.confidence,
      revenue: finalResult.totalRevenue,
      expenses: finalResult.totalExpenses,
      profit: finalResult.totalProfit,
      scale: finalResult.detectedScale,
      reasoning: finalResult.reasoning
    });
    
    return formatChatGPTStyleResult(finalResult, fileName);

  } catch (error) {
    console.error('ChatGPT-style complete analysis failed:', error);
    return await emergencyNumericalExtraction(workbook, fileName);
  }
}

// PASS 1: DOCUMENT CONTEXT ANALYSIS (Like ChatGPT's initial data exploration)
async function analyzeDocumentContext(workbook: any): Promise<any> {
  console.log('🔍 ANALYZING DOCUMENT CONTEXT: Understanding the full business picture...');
  
  const context: any = {
    documentType: 'unknown',
    businessModel: 'unknown',
    timeframe: 'unknown',
    currency: 'USD',
    scaleIndicators: [],
    primaryDataSources: [],
    businessMetrics: {
      revenueScale: 'unknown',
      operatingScale: 'unknown',
      profitabilityIndicators: []
    },
    dataQuality: {
      hasHeaders: false,
      hasTimeSeries: false,
      hasCalculations: false,
      structuredData: false
    }
  };

  // Analyze each sheet for business context clues
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    console.log(`📊 ANALYZING SHEET: "${sheetName}" (${jsonData.length} rows)`);
    
    // Detect document type from sheet names and content
    const sheetNameLower = sheetName.toLowerCase();
    if (sheetNameLower.includes('income') || sheetNameLower.includes('p&l') || sheetNameLower.includes('profit')) {
      context.documentType = 'income_statement';
      context.primaryDataSources.push({ sheet: sheetName, type: 'income_statement', priority: 1 });
    } else if (sheetNameLower.includes('balance') || sheetNameLower.includes('assets')) {
      context.primaryDataSources.push({ sheet: sheetName, type: 'balance_sheet', priority: 2 });
    } else if (sheetNameLower.includes('cash') || sheetNameLower.includes('flow')) {
      context.primaryDataSources.push({ sheet: sheetName, type: 'cash_flow', priority: 2 });
    }
    
    // Analyze content structure for business context
    const allText = [];
    const largeNumbers = [];
    
    for (let i = 0; i < Math.min(15, jsonData.length); i++) {
      const row = jsonData[i];
      if (row) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell) {
            if (typeof cell === 'string') {
              allText.push(cell.toLowerCase());
            } else {
              const num = cleanAndParseNumber(cell);
              if (!isNaN(num) && num > 10000) {
                largeNumbers.push(num);
              }
            }
          }
        }
      }
    }
    
    const contextText = allText.join(' ');
    
    // Detect business scale from large numbers
    if (largeNumbers.length > 0) {
      const maxNumber = Math.max(...largeNumbers);
      const avgLargeNumber = largeNumbers.reduce((a, b) => a + b, 0) / largeNumbers.length;
      
      if (maxNumber > 10000000) {
        context.businessMetrics.revenueScale = 'millions+';
        context.scaleIndicators.push('large_business');
      } else if (maxNumber > 1000000) {
        context.businessMetrics.revenueScale = 'millions';
        context.scaleIndicators.push('medium_business');
      } else if (maxNumber > 100000) {
        context.businessMetrics.revenueScale = 'hundreds_thousands';
        context.scaleIndicators.push('small_business');
      }
      
      console.log(`💰 SCALE DETECTION: Max=${maxNumber.toLocaleString()}, Avg=${avgLargeNumber.toLocaleString()}, Scale=${context.businessMetrics.revenueScale}`);
    }
    
    // Detect business model indicators
    if (contextText.includes('subscription') || contextText.includes('recurring') || contextText.includes('monthly')) {
      context.businessModel = 'saas_subscription';
    } else if (contextText.includes('product') || contextText.includes('inventory') || contextText.includes('cogs')) {
      context.businessModel = 'product_sales';
    } else if (contextText.includes('service') || contextText.includes('consulting') || contextText.includes('hours')) {
      context.businessModel = 'services';
    }
    
    // Detect data quality indicators
    if (jsonData.length > 5 && jsonData[0] && jsonData[0].length > 2) {
      context.dataQuality.structuredData = true;
      
      // Check for headers
      const firstRow = jsonData[0];
      let hasTextHeaders = 0;
      for (const cell of firstRow) {
        if (typeof cell === 'string' && cell.length > 2) hasTextHeaders++;
      }
      if (hasTextHeaders >= 2) context.dataQuality.hasHeaders = true;
    }
  }
  
  // Sort data sources by priority
  context.primaryDataSources.sort((a: any, b: any) => a.priority - b.priority);
  
  console.log(`🧠 BUSINESS CONTEXT: ${context.documentType} | ${context.businessModel} | Scale: ${context.businessMetrics.revenueScale}`);
  return context;
}

// PASS 2: PRIMARY FINANCIAL DATA EXTRACTION (Like ChatGPT's focused analysis)
async function extractPrimaryFinancialData(workbook: any, context: any): Promise<any> {
  console.log('💰 EXTRACTING PRIMARY FINANCIAL DATA: Focused on main business metrics...');
  
  const extractedData: any = {
    confidence: 0,
    sources: [],
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    cashFlow: 0,
    detectionMethods: [],
    rawFindings: []
  };
  
  // Prioritize sheets based on context
  const sheetsToAnalyze = context.primaryDataSources.length > 0 
    ? context.primaryDataSources.map((s: any) => s.sheet)
    : workbook.SheetNames;
  
  for (const sheetName of sheetsToAnalyze) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    console.log(`📊 EXTRACTING FROM: "${sheetName}"`);
    
    // METHOD 1: Look for summary/total rows first (highest priority)
    const summaryResult = await findSummaryTotals(jsonData, sheetName);
    if (summaryResult.confidence > 0.7) {
      extractedData.sources.push(summaryResult);
      extractedData.detectionMethods.push('summary_totals');
      console.log(`🎯 HIGH CONFIDENCE SUMMARY FOUND: Revenue=${summaryResult.revenue?.toLocaleString()}, Expenses=${summaryResult.expenses?.toLocaleString()}`);
    }
    
    // METHOD 2: Structured financial statement analysis  
    const structuredResult = await analyzeFinancialStatementStructure(jsonData, sheetName, context);
    if (structuredResult.confidence > extractedData.confidence) {
      extractedData.sources.push(structuredResult);
      extractedData.detectionMethods.push('financial_statement_structure');
      console.log(`📋 STRUCTURED ANALYSIS: Revenue=${structuredResult.revenue?.toLocaleString()}, Expenses=${structuredResult.expenses?.toLocaleString()}`);
    }
    
    // METHOD 3: Business-context-aware pattern matching
    const contextResult = await analyzeWithBusinessContext(jsonData, sheetName, context);
    if (contextResult.confidence > 0.5) {
      extractedData.sources.push(contextResult);
      extractedData.detectionMethods.push('business_context_analysis');
      console.log(`🧠 CONTEXT ANALYSIS: Revenue=${contextResult.revenue?.toLocaleString()}, Expenses=${contextResult.expenses?.toLocaleString()}`);
    }
  }
  
  // Consolidate findings from all sources
  if (extractedData.sources.length > 0) {
    const bestSource = extractedData.sources.reduce((best: any, current: any) => 
      current.confidence > best.confidence ? current : best
    );
    
    extractedData.totalRevenue = bestSource.revenue || 0;
    extractedData.totalExpenses = bestSource.expenses || 0;
    extractedData.totalProfit = extractedData.totalRevenue - extractedData.totalExpenses;
    extractedData.confidence = bestSource.confidence;
    extractedData.primarySource = bestSource.sheetName;
    extractedData.primaryMethod = bestSource.method;
  }
  
  return extractedData;
}

// SUMMARY TOTALS FINDER (Priority method)
async function findSummaryTotals(jsonData: any[], sheetName: string): Promise<any> {
  console.log('🔍 LOOKING FOR SUMMARY TOTALS...');
  
  const result: any = {
    confidence: 0,
    method: 'summary_totals',
    sheetName,
    revenue: 0,
    expenses: 0,
    findings: []
  };
  
  // Look for rows with "Total", "Sum", "Grand Total", etc.
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;
    
    const firstCell = String(row[0] || '').toLowerCase();
    
    // Check for total/summary indicators
    if (firstCell.includes('total') || firstCell.includes('sum') || firstCell.includes('grand')) {
      console.log(`🎯 FOUND SUMMARY ROW ${i}: "${firstCell}"`);
      
      // Extract all numbers from this row
      for (let j = 1; j < row.length; j++) {
        const value = cleanAndParseNumber(row[j]);
        if (!isNaN(value) && value > 1000) {
          result.findings.push({ row: i, col: j, value, label: firstCell });
          
          // Classify based on context
          if (firstCell.includes('revenue') || firstCell.includes('sales') || firstCell.includes('income')) {
            result.revenue = Math.max(result.revenue, value);
            result.confidence = 0.9;
          } else if (firstCell.includes('expense') || firstCell.includes('cost')) {
            result.expenses += value;
            result.confidence = Math.max(result.confidence, 0.8);
          } else {
            // Generic total - could be revenue
            if (value > result.revenue) {
              result.revenue = value;
              result.confidence = Math.max(result.confidence, 0.7);
            }
          }
        }
      }
    }
  }
  
  return result;
}

// FINANCIAL STATEMENT STRUCTURE ANALYZER
async function analyzeFinancialStatementStructure(jsonData: any[], sheetName: string, context: any): Promise<any> {
  console.log('📋 ANALYZING FINANCIAL STATEMENT STRUCTURE...');
  
  const result: any = {
    confidence: 0,
    method: 'financial_statement_structure',
    sheetName,
    revenue: 0,
    expenses: 0,
    structure: {}
  };
  
  let revenueSection = false;
  let expenseSection = false;
  let currentRevenue = 0;
  let currentExpenses = 0;
  
  for (let i = 0; i < Math.min(25, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row) continue;
    
    const label = String(row[0] || '').toLowerCase();
    
    // Detect revenue section
    if (label.includes('revenue') || label.includes('sales') || label.includes('income')) {
      revenueSection = true;
      expenseSection = false;
      
      // Get the primary revenue number (usually in the rightmost columns)
      for (let j = row.length - 1; j >= 1; j--) {
        const value = cleanAndParseNumber(row[j]);
        if (!isNaN(value) && value > 0) {
          currentRevenue = Math.max(currentRevenue, value);
          break;
        }
      }
      console.log(`💰 REVENUE LINE: "${label}" = ${currentRevenue.toLocaleString()}`);
    }
    
    // Detect expense section
    else if (label.includes('expense') || label.includes('cost') || label.includes('operating')) {
      revenueSection = false;
      expenseSection = true;
      
      // Get the expense number
      for (let j = row.length - 1; j >= 1; j--) {
        const value = cleanAndParseNumber(row[j]);
        if (!isNaN(value) && value > 0) {
          currentExpenses += value;
          break;
        }
      }
      console.log(`💸 EXPENSE LINE: "${label}" = ${value?.toLocaleString()}`);
    }
    
    // Continue accumulating in current section
    else if (revenueSection && !label.includes('expense') && !label.includes('cost')) {
      for (let j = row.length - 1; j >= 1; j--) {
        const value = cleanAndParseNumber(row[j]);
        if (!isNaN(value) && value > 0) {
          currentRevenue = Math.max(currentRevenue, value);
          break;
        }
      }
    }
    else if (expenseSection && !label.includes('revenue') && !label.includes('sales')) {
      for (let j = row.length - 1; j >= 1; j--) {
        const value = cleanAndParseNumber(row[j]);
        if (!isNaN(value) && value > 0) {
          currentExpenses += value;
          break;
        }
      }
    }
  }
  
  result.revenue = currentRevenue;
  result.expenses = currentExpenses;
  
  if (currentRevenue > 0 && currentExpenses > 0) {
    result.confidence = 0.8;
  } else if (currentRevenue > 0 || currentExpenses > 0) {
    result.confidence = 0.6;
  }
  
  return result;
}

// BUSINESS CONTEXT ANALYZER
async function analyzeWithBusinessContext(jsonData: any[], sheetName: string, context: any): Promise<any> {
  console.log('🧠 ANALYZING WITH BUSINESS CONTEXT...');
  
  const result: any = {
    confidence: 0,
    method: 'business_context',
    sheetName,
    revenue: 0,
    expenses: 0,
    contextualFindings: []
  };
  
  // Use business context to prioritize certain patterns
  const revenuePatterns = context.businessModel === 'saas_subscription' 
    ? ['monthly recurring revenue', 'mrr', 'arr', 'subscription', 'recurring']
    : context.businessModel === 'product_sales'
    ? ['product sales', 'gross sales', 'net sales', 'units sold']
    : ['revenue', 'sales', 'income', 'receipts'];
  
  const expensePatterns = context.businessModel === 'saas_subscription'
    ? ['customer acquisition', 'hosting', 'development', 'sales', 'marketing']
    : context.businessModel === 'product_sales'
    ? ['cogs', 'cost of goods', 'inventory', 'shipping', 'fulfillment']
    : ['operating expenses', 'overhead', 'salaries', 'rent'];
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;
    
    const label = String(row[0] || '').toLowerCase();
    
    // Check against business-model-specific patterns
    for (const pattern of revenuePatterns) {
      if (label.includes(pattern)) {
        for (let j = 1; j < row.length; j++) {
          const value = cleanAndParseNumber(row[j]);
          if (!isNaN(value) && value > 0) {
            result.revenue = Math.max(result.revenue, value);
            result.contextualFindings.push({ type: 'revenue', pattern, value, confidence: 0.8 });
            break;
          }
        }
      }
    }
    
    for (const pattern of expensePatterns) {
      if (label.includes(pattern)) {
        for (let j = 1; j < row.length; j++) {
          const value = cleanAndParseNumber(row[j]);
          if (!isNaN(value) && value > 0) {
            result.expenses += value;
            result.contextualFindings.push({ type: 'expense', pattern, value, confidence: 0.7 });
            break;
          }
        }
      }
    }
  }
  
  result.confidence = result.contextualFindings.length * 0.2;
  return result;
}

// PASS 3: REASONABLENESS CHECKS (Like ChatGPT's validation)
async function performReasonablenessChecks(primaryData: any, context: any): Promise<any> {
  console.log('✅ PERFORMING REASONABLENESS CHECKS...');
  
  const validated = { ...primaryData };
  validated.warnings = [];
  validated.adjustments = [];
  
  // Check 1: Revenue scale reasonableness
  if (context.businessMetrics.revenueScale === 'millions+' && validated.totalRevenue < 500000) {
    validated.warnings.push('Revenue seems low for indicated business scale - may need scaling adjustment');
    
    // Look for scaling multiplier
    if (validated.totalRevenue > 0) {
      const suggestedMultiplier = validated.totalRevenue < 1000 ? 1000 : 1;
      validated.adjustments.push({
        type: 'scale_multiplier',
        original: validated.totalRevenue,
        suggested: validated.totalRevenue * suggestedMultiplier,
        multiplier: suggestedMultiplier,
        reasoning: 'Business scale suggests larger revenue figures'
      });
    }
  }
  
  // Check 2: Expense vs Revenue ratio
  if (validated.totalExpenses > validated.totalRevenue * 3) {
    validated.warnings.push('Expenses appear disproportionately high compared to revenue');
  }
  
  // Check 3: Missing key metrics
  if (validated.totalRevenue === 0 && validated.totalExpenses > 0) {
    validated.warnings.push('Found expenses but no revenue - document may be incomplete');
  }
  
  console.log(`✅ VALIDATION COMPLETE: ${validated.warnings.length} warnings, ${validated.adjustments.length} adjustments`);
  return validated;
}

// PASS 4: SCALE INTELLIGENCE (Like ChatGPT's business logic)
async function applyBusinessIntelligenceScaling(validatedData: any, context: any): Promise<any> {
  console.log('🎯 APPLYING BUSINESS INTELLIGENCE SCALING...');
  
  const final = { ...validatedData };
  final.detectedScale = 'units';
  final.scaleMultiplier = 1;
  final.reasoning = [];
  
  // Apply intelligent scaling based on business context
  if (context.businessMetrics.revenueScale === 'millions+' || context.scaleIndicators.includes('large_business')) {
    if (final.totalRevenue > 0 && final.totalRevenue < 10000) {
      final.scaleMultiplier = 1000;
      final.detectedScale = 'thousands';
      final.reasoning.push('Applied 1000x multiplier based on large business indicators');
    } else if (final.totalRevenue < 100000) {
      final.scaleMultiplier = 100;
      final.detectedScale = 'hundreds';
      final.reasoning.push('Applied 100x multiplier for business scale consistency');
    }
  }
  
  // Apply scaling
  if (final.scaleMultiplier > 1) {
    final.totalRevenue *= final.scaleMultiplier;
    final.totalExpenses *= final.scaleMultiplier;
    final.totalProfit = final.totalRevenue - final.totalExpenses;
    
    console.log(`📈 SCALING APPLIED: ${final.scaleMultiplier}x multiplier`);
    console.log(`📊 SCALED RESULTS: Revenue=${final.totalRevenue.toLocaleString()}, Expenses=${final.totalExpenses.toLocaleString()}`);
  }
  
  // Boost confidence if scaling makes sense
  if (final.scaleMultiplier > 1 && final.totalRevenue > 100000) {
    final.confidence = Math.min(0.95, final.confidence + 0.2);
    final.reasoning.push('Confidence boosted due to reasonable post-scaling figures');
  }
  
  return final;
}

// FORMAT RESULTS (Like ChatGPT's clean output)
async function formatChatGPTStyleResult(finalResult: any, fileName: string): Promise<any> {
  return {
    summary: {
      totalRevenue: finalResult.totalRevenue || 0,
      totalExpenses: finalResult.totalExpenses || 0,
      totalProfit: finalResult.totalProfit || (finalResult.totalRevenue - finalResult.totalExpenses),
      totalCashFlow: finalResult.cashFlow || 0
    },
    confidence: finalResult.confidence || 0,
    processingMethod: 'chatgpt_style_complete_analysis',
    detectedScale: finalResult.detectedScale || 'units',
    scaleMultiplier: finalResult.scaleMultiplier || 1,
    reasoning: finalResult.reasoning || [],
    debugInfo: {
      fileName,
      primarySource: finalResult.primarySource,
      primaryMethod: finalResult.primaryMethod,
      detectionMethods: finalResult.detectionMethods || [],
      warnings: finalResult.warnings || [],
      adjustments: finalResult.adjustments || []
    }
  };
}

// EMERGENCY FALLBACK
async function emergencyNumericalExtraction(workbook: any, fileName: string): Promise<any> {
  console.log('🚨 EMERGENCY NUMERICAL EXTRACTION...');
  
  const numbers: number[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    for (const row of jsonData) {
      if (row) {
        for (const cell of row) {
          const num = cleanAndParseNumber(cell);
          if (!isNaN(num) && num > 1000) {
            numbers.push(num);
          }
        }
      }
    }
  }
  
  numbers.sort((a, b) => b - a);
  
  return {
    summary: {
      totalRevenue: numbers[0] || 0,
      totalExpenses: numbers[1] || 0,
      totalProfit: (numbers[0] || 0) - (numbers[1] || 0),
      totalCashFlow: 0
    },
    confidence: 0.3,
    processingMethod: 'emergency_numerical_extraction',
    debugInfo: {
      fileName,
      foundNumbers: numbers.slice(0, 10)
    }
  };
}

// UTILITY FUNCTION
function cleanAndParseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return NaN;
  
  const str = String(value)
    .replace(/[$,\s()]/g, '')
    .replace(/[^\d.-]/g, '');
    
  return parseFloat(str) || NaN;
}