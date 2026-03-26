// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Use Puter.js for free Claude access
const PUTER_AI_URL = 'https://api.puter.com/v1/ai/chat';

// Helper function to parse CSV content for detailed category analysis
async function parseCSVForCategories(csvContent: string) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return {};

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const breakdown = {
    categories: { revenue: [], expenses: [], assets: [], liabilities: [] },
    summary: { totalRevenue: 0, totalExpenses: 0, totalProfit: 0, itemCount: 0 }
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    if (row.length < 2) continue;

    const description = row[0] || `Item ${i}`;
    const values = row.slice(1).map(cell => {
      const cleaned = cell.replace(/[^0-9.-]/g, '');
      return cleaned ? parseFloat(cleaned) : 0;
    }).filter(val => !isNaN(val) && val !== 0);

    if (values.length > 0) {
      const amount = Math.abs(values[0]);
      const isExpense = description.toLowerCase().includes('expense') || 
                      description.toLowerCase().includes('cost') || 
                      description.toLowerCase().includes('payment');

      const categoryItem = {
        description,
        amount,
        percentage: 0, // Will be calculated later
        verificationSource: `CSV row ${i}`
      };

      if (isExpense) {
        breakdown.categories.expenses.push(categoryItem);
        breakdown.summary.totalExpenses += amount;
      } else {
        breakdown.categories.revenue.push(categoryItem);
        breakdown.summary.totalRevenue += amount;
      }
    }
  }

  // Calculate percentages
  ['revenue', 'expenses'].forEach(type => {
    const total = breakdown.summary[type === 'revenue' ? 'totalRevenue' : 'totalExpenses'];
    breakdown.categories[type].forEach(item => {
      item.percentage = total > 0 ? (item.amount / total) * 100 : 0;
    });
    breakdown.categories[type].sort((a, b) => b.amount - a.amount);
  });

  breakdown.summary.totalProfit = breakdown.summary.totalRevenue - breakdown.summary.totalExpenses;
  breakdown.summary.itemCount = breakdown.categories.revenue.length + breakdown.categories.expenses.length;

  return breakdown;
}

// Puter.js Claude API integration
async function callClaudeWithPuter(prompt: string, model: string = 'claude-sonnet-4') {
  try {
    console.log(`Attempting ${model} analysis via Puter.js...`);
    
    const response = await fetch(PUTER_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an elite financial analyst. Return only valid JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`Puter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`${model} via Puter.js successful`);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`${model} via Puter.js failed:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { financialData, userId, documentId, userContext } = await req.json();

    console.log('Claude Financial Analysis - Processing request for user:', userId);
    console.log('Document ID:', documentId);
    console.log('Financial data overview:', {
      revenue: financialData?.revenue,
      expenses: financialData?.expenses,
      cash_flow: financialData?.cash_flow
    });

    // Get detailed financial data and document content for deep analysis
    let documentContent = '';
    let detailedFinancialData = [];
    let rawDocumentData = '';
    let enhancedFinancialBreakdown = {};

    if (documentId) {
      // Get document details and content
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document?.storage_path) {
        try {
          const { data: fileData } = await supabase.storage
            .from('user-documents')
            .download(document.storage_path);
          
          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            
            if (document.file_name.endsWith('.csv') || document.file_name.endsWith('.txt')) {
              rawDocumentData = new TextDecoder().decode(arrayBuffer);
              documentContent = `CSV/Text Content Analysis:\n${rawDocumentData}`;
              
              // Enhanced CSV parsing for category extraction
              enhancedFinancialBreakdown = await parseCSVForCategories(rawDocumentData);
              
            } else if (document.file_name.endsWith('.xlsx') || document.file_name.endsWith('.xls')) {
              // Enhanced XLSX processing
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              
              // Call enhanced XLSX processor
              try {
                const { data: xlsxData, error: xlsxError } = await supabase.functions.invoke('enhanced-xlsx-processor', {
                  body: {
                    fileContent: base64Data,
                    fileName: document.file_name,
                    userId: userId
                  }
                });
                
                if (!xlsxError && xlsxData) {
                  documentContent = `XLSX Content Analysis:\n${JSON.stringify(xlsxData.detailedBreakdown, null, 2)}`;
                  enhancedFinancialBreakdown = xlsxData.detailedBreakdown;
                  console.log('Enhanced XLSX breakdown:', enhancedFinancialBreakdown);
                } else {
                  documentContent = `XLSX document: ${document.file_name} (${arrayBuffer.byteLength} bytes) - Basic processing only`;
                }
              } catch (xlsxError) {
                console.warn('Enhanced XLSX processing failed:', xlsxError);
                documentContent = `XLSX document: ${document.file_name} (${arrayBuffer.byteLength} bytes) - Enhanced processing unavailable`;
              }
              
            } else {
              documentContent = `Binary document: ${document.file_name} (${arrayBuffer.byteLength} bytes)`;
            }
            
            console.log('Retrieved document content, length:', documentContent.length);
          }
        } catch (storageError) {
          console.log('Could not retrieve document content:', storageError);
        }
      }

      // Get all financial records for this document for detailed analysis
      const { data: allRecords } = await supabase
        .from('financial_data')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (allRecords && allRecords.length > 0) {
        detailedFinancialData = allRecords;
        console.log('Retrieved detailed financial records:', allRecords.length);
      }

      // Check for existing analysis (but allow refresh)
      if (document?.metadata?.claude_analysis && !document?.metadata?.force_reanalysis) {
        console.log('Returning cached Claude analysis');
        return new Response(JSON.stringify(document.metadata.claude_analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Calculate basic metrics
    const revenue = financialData.revenue || 0;
    const expenses = financialData.expenses || 0;
    const profit = revenue - expenses;
    const cashFlow = financialData.cash_flow || 0;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Get user profile and historical data
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: historicalScores } = await supabase
      .from('business_health_scores')
      .select('score, factors, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // CHATGPT-LEVEL DOCUMENT ANALYSIS PROMPT
    const analysisPrompt = `🎯 **CHATGPT-LEVEL DOCUMENT ANALYSIS** - Process this document with the same accuracy and intelligence as ChatGPT would.

**CRITICAL SCALE & UNIT DETECTION:**
You MUST detect and apply proper scaling for financial figures:
- Look for indicators: "in thousands", "in millions", "(000)", "$000", "×1000", etc.
- Apply scaling factors: 1000x for thousands, 1,000,000x for millions
- Revenue in millions should show as $X,XXX,XXX not $X,XXX

**BUSINESS CONTEXT:**
${userContext || `- Company: ${userProfile?.company_name || 'Unknown'}
- Industry: ${userProfile?.industry || 'Technology'}  
- Business Type: ${userProfile?.business_type || 'Unknown'}
- Company Size: ${userProfile?.company_size || 'Small Business'}`}

**CURRENT FINANCIAL OVERVIEW (VERIFY & CORRECT):**
- Revenue: $${revenue.toLocaleString()} [VERIFY SCALE]
- Expenses: $${expenses.toLocaleString()} [VERIFY SCALE]
- Net Profit: $${profit.toLocaleString()} [CALCULATE]
- Cash Flow: $${cashFlow.toLocaleString()} [VERIFY SCALE]
- Profit Margin: ${profitMargin.toFixed(2)}% [CALCULATE]

**ENHANCED DOCUMENT DATA:**
${enhancedFinancialBreakdown.summary ? `
📋 **EXTRACTED SUMMARY**:
- Total Revenue: $${enhancedFinancialBreakdown.summary.totalRevenue?.toLocaleString() || '0'}
- Total Expenses: $${enhancedFinancialBreakdown.summary.totalExpenses?.toLocaleString() || '0'}  
- Items Found: ${enhancedFinancialBreakdown.summary.itemCount || 0}
- Scale Applied: ${enhancedFinancialBreakdown.debugInfo?.scaleFactor || 1}x

📈 **REVENUE CATEGORIES**:
${enhancedFinancialBreakdown.categories?.revenue?.slice(0, 10).map(item => `- ${item.description}: $${item.amount?.toLocaleString() || '0'}`).join('\n') || 'None detected'}

📉 **EXPENSE CATEGORIES**:
${enhancedFinancialBreakdown.categories?.expenses?.slice(0, 10).map(item => `- ${item.description}: $${item.amount?.toLocaleString() || '0'}`).join('\n') || 'None detected'}
` : 'Enhanced breakdown not available'}

**HISTORICAL CONTEXT:**
${historicalScores?.map(score => `- Health Score: ${score.score}/100 (${new Date(score.created_at).toLocaleDateString()})`).join('\n') || 'No historical data available'}

**DETAILED FINANCIAL RECORDS:** (${detailedFinancialData.length} records)
${detailedFinancialData.slice(0, 20).map(record => 
  `Period: ${record.period_start} to ${record.period_end} | Revenue: $${(record.revenue || 0).toLocaleString()} | Expenses: $${(record.expenses || 0).toLocaleString()}`
).join('\n')}

**DOCUMENT CONTENT FOR ANALYSIS:**
${documentContent || 'No document content available'}

**ANALYSIS REQUIREMENTS:**
1. **Million-Dollar Detection**: If revenue appears to be in millions based on context, scale appropriately
2. **Multi-Sheet Intelligence**: Process all relevant financial sheets
3. **Industry Benchmarking**: Compare against ${userProfile?.industry || 'Technology'} standards
4. **Quality Verification**: Cross-check totals vs. line items
5. **ChatGPT-Level Understanding**: Extract insights like a human analyst would

**Return this exact JSON format:**
{
  "healthScore": number,
  "healthScoreCalculation": {
    "profitabilityScore": number,
    "cashFlowScore": number,  
    "growthScore": number,
    "efficiencyScore": number,
    "riskScore": number,
    "formula": "string showing calculation"
  },
  "summary": "comprehensive executive summary with specific dollar amounts",
  "calculationVerification": {
    "verifiedRevenue": number,
    "verifiedExpenses": number,
    "verifiedProfit": number,
    "scaleFactorApplied": number,
    "discrepanciesFound": ["list of issues"],
    "dataSource": "description of source document"
  },
  "topExpenseCategories": [
    {
      "category": "string",
      "amount": number,
      "percentage": number,
      "description": "detailed description",
      "itemCount": number,
      "verificationSource": "exact source reference"
    }
  ],
  "topRevenueCategories": [
    {
      "category": "string",
      "amount": number,
      "percentage": number,
      "description": "detailed description", 
      "itemCount": number,
      "verificationSource": "exact source reference"
    }
  ],
  "insights": [
    {
      "title": "string",
      "description": "string", 
      "impact": "High|Medium|Low",
      "metrics": "supporting numbers",
      "confidence": "High|Medium|Low"
    }
  ],
  "recommendations": [
    {
      "title": "string",
      "description": "actionable recommendation",
      "priority": "High|Medium|Low",
      "timeframe": "implementation timeline",
      "expectedImpact": "projected outcome",
      "estimatedROI": "return calculation",
      "specificTarget": "exact goals"
    }
  ],
  "riskFactors": ["specific risks identified"],
  "trends": {
    "profitability": "Improving|Stable|Declining",
    "cashFlow": "Improving|Stable|Declining", 
    "efficiency": "Improving|Stable|Declining",
    "growth": "Accelerating|Steady|Slowing"
  },
  "analysisMetadata": {
    "aiModelsUsed": ["Puter.js-Claude-Sonnet-4"],
    "confidenceLevel": "High|Medium|Low",
    "dataQuality": "Excellent|Good|Fair|Poor",
    "processingMethod": "ChatGPT-level document analysis"
  }
}`;

    let analysisResult;
    
    try {
      // Try Claude Sonnet 4 first via Puter.js
      console.log('Starting AI analysis via Puter.js: Claude Sonnet 4');
      const claudeResponse = await callClaudeWithPuter(analysisPrompt, 'claude-sonnet-4');
      
      // Parse the response 
      let parsedResponse;
      try {
        // Try to extract JSON from the response
        const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(claudeResponse);
        }
      } catch (parseError) {
        console.log('JSON parsing failed, trying Opus 4...');
        throw new Error('JSON parsing failed');
      }
      
      analysisResult = parsedResponse;
      console.log('Claude Sonnet 4 via Puter.js analysis successful');
      
    } catch (sonnetError) {
      console.log('Claude Sonnet 4 failed, trying Opus 4...', sonnetError.message);
      
      try {
        // Fallback to Claude Opus 4 via Puter.js
        const opusResponse = await callClaudeWithPuter(analysisPrompt, 'claude-opus-4');
        
        let parsedResponse;
        try {
          const jsonMatch = opusResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            parsedResponse = JSON.parse(opusResponse);
          }
        } catch (parseError) {
          throw new Error('Opus JSON parsing failed');
        }
        
        analysisResult = parsedResponse;
        console.log('Claude Opus 4 via Puter.js analysis successful');
        
      } catch (opusError) {
        console.log('Both Claude models failed via Puter.js:', opusError.message);
        // Fallback to rule-based analysis
        analysisResult = await provideFallbackAnalysis(financialData);
      }
    }

    // Add metadata about the analysis
    analysisResult.analysisMetadata = {
      ...(analysisResult.analysisMetadata || {}),
      aiModelsUsed: ['Puter.js-Claude-Free'],
      processingTimestamp: new Date().toISOString(),
      documentProcessed: !!documentId,
      enhancedBreakdownUsed: !!enhancedFinancialBreakdown.summary
    };

    // Calculate and store health score
    const healthScore = analysisResult.healthScore || 75;
    const healthFactors = {
      profitability: analysisResult.healthScoreCalculation?.profitabilityScore || 70,
      cashFlow: analysisResult.healthScoreCalculation?.cashFlowScore || 70,
      growth: analysisResult.healthScoreCalculation?.growthScore || 70,
      efficiency: analysisResult.healthScoreCalculation?.efficiencyScore || 70,
      risk: analysisResult.healthScoreCalculation?.riskScore || 70
    };

    // Store business health score
    await supabase
      .from('business_health_scores')
      .insert({
        user_id: userId,
        score: healthScore,
        factors: healthFactors,
        recommendations: analysisResult.recommendations || [],
        risk_factors: analysisResult.riskFactors || [],
        metadata: {
          document_id: documentId,
          analysis_type: 'claude_enhanced',
          model_used: 'puter_js_claude'
        }
      });

    // Update document with analysis results if documentId exists
    if (documentId) {
      await supabase
        .from('documents')
        .update({
          metadata: {
            claude_analysis: analysisResult,
            health_score: healthScore,
            processed_at: new Date().toISOString(),
            ai_model: 'puter_js_claude'
          }
        })
        .eq('id', documentId);
    }

    console.log('Claude analysis completed successfully via Puter.js');
    
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Claude Financial Analysis:', error);
    
    // Provide fallback analysis
    const fallbackResult = await provideFallbackAnalysis(financialData || {});
    
    return new Response(JSON.stringify(fallbackResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced fallback analysis for when AI fails
async function provideFallbackAnalysis(financialData: any) {
  console.log('Providing enhanced fallback analysis');
  
  const revenue = financialData?.revenue || 0;
  const expenses = financialData?.expenses || 0;
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const cashFlow = financialData?.cash_flow || profit;

  // Calculate health score components
  const profitabilityScore = Math.min(100, Math.max(0, 50 + (profitMargin * 2)));
  const cashFlowScore = Math.min(100, Math.max(0, cashFlow > 0 ? 80 : 20));
  const growthScore = 70; // Default neutral
  const efficiencyScore = revenue > 0 ? Math.min(100, (revenue / Math.max(expenses, 1)) * 25) : 50;
  const riskScore = profitMargin > 10 ? 90 : profitMargin > 0 ? 70 : 30;

  const healthScore = Math.round(
    (profitabilityScore * 0.25) + 
    (cashFlowScore * 0.25) + 
    (growthScore * 0.20) + 
    (efficiencyScore * 0.15) + 
    (riskScore * 0.15)
  );

  const insights = [];
  const recommendations = [];
  const riskFactors = [];

  // Generate insights based on financial metrics
  if (profitMargin > 20) {
    insights.push({
      title: "Strong Profitability",
      description: `Excellent profit margin of ${profitMargin.toFixed(1)}% indicates efficient operations`,
      impact: "High",
      metrics: `Profit margin: ${profitMargin.toFixed(1)}%`,
      confidence: "High"
    });
  } else if (profitMargin < 5) {
    insights.push({
      title: "Low Profitability",
      description: "Profit margins are concerning and need immediate attention",
      impact: "High", 
      metrics: `Profit margin: ${profitMargin.toFixed(1)}%`,
      confidence: "High"
    });
    riskFactors.push("Low profit margins indicating potential operational inefficiencies");
  }

  if (revenue > expenses * 2) {
    recommendations.push({
      title: "Optimize Growth Investment",
      description: "Strong revenue performance allows for strategic growth investments",
      priority: "Medium",
      timeframe: "3-6 months",
      expectedImpact: "Increased market share and revenue growth",
      estimatedROI: "15-25%",
      specificTarget: `Invest 10-15% of excess revenue ($${((revenue - expenses) * 0.1).toLocaleString()}) in growth initiatives`
    });
  } else if (expenses > revenue) {
    recommendations.push({
      title: "Cost Reduction Initiative",
      description: "Immediate cost reduction needed to achieve profitability",
      priority: "High",
      timeframe: "1-3 months", 
      expectedImpact: "Return to profitability",
      estimatedROI: "Direct cost savings",
      specificTarget: `Reduce expenses by $${(expenses - revenue).toLocaleString()} minimum`
    });
  }

  return {
    healthScore,
    healthScoreCalculation: {
      profitabilityScore,
      cashFlowScore,
      growthScore, 
      efficiencyScore,
      riskScore,
      formula: "Profitability(25%) + CashFlow(25%) + Growth(20%) + Efficiency(15%) + Risk(15%)"
    },
    summary: `Financial analysis shows ${revenue > expenses ? 'profitable' : 'loss-making'} operations with $${revenue.toLocaleString()} in revenue and $${expenses.toLocaleString()} in expenses, resulting in ${profit >= 0 ? 'profit' : 'loss'} of $${Math.abs(profit).toLocaleString()}.`,
    calculationVerification: {
      verifiedRevenue: revenue,
      verifiedExpenses: expenses,
      verifiedProfit: profit,
      scaleFactorApplied: 1,
      discrepanciesFound: ["Fallback analysis used - manual verification recommended"],
      dataSource: "Basic financial data summary"
    },
    topExpenseCategories: [
      {
        category: "Operating Expenses",
        amount: expenses * 0.7,
        percentage: 70,
        description: "Primary operational costs",
        itemCount: 1,
        verificationSource: "Estimated breakdown"
      },
      {
        category: "Administrative Costs", 
        amount: expenses * 0.3,
        percentage: 30,
        description: "Administrative and overhead expenses",
        itemCount: 1,
        verificationSource: "Estimated breakdown"
      }
    ],
    topRevenueCategories: [
      {
        category: "Primary Revenue",
        amount: revenue,
        percentage: 100,
        description: "Main business revenue stream",
        itemCount: 1,
        verificationSource: "Total revenue figure"
      }
    ],
    insights,
    recommendations,
    riskFactors,
    trends: {
      profitability: profit > 0 ? "Stable" : "Declining",
      cashFlow: cashFlow > 0 ? "Stable" : "Declining",
      efficiency: "Stable",
      growth: "Stable"
    },
    analysisMetadata: {
      aiModelsUsed: ["Fallback Rule-Based"],
      confidenceLevel: "Medium",
      dataQuality: "Fair",
      processingMethod: "Rule-based fallback analysis"
    }
  };
}