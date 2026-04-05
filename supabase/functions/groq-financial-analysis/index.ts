// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert CSV to markdown table for better AI interpretation
function convertCsvToMarkdownTable(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return csvContent;
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  let markdown = '| ' + headers.join(' | ') + ' |\n';
  markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  for (let i = 1; i < Math.min(lines.length, 21); i++) { // Limit to 20 data rows
    const cells = lines[i].split(',').map(cell => {
      let cleaned = cell.trim().replace(/"/g, '');
      // Format numbers for better readability
      if (cleaned.match(/^\$?-?\d{1,3}(,\d{3})*(\.\d{2})?$/)) {
        cleaned = `**${cleaned}**`; // Bold numbers for emphasis
      }
      return cleaned;
    });
    markdown += '| ' + cells.join(' | ') + ' |\n';
  }
  
  if (lines.length > 21) {
    markdown += `\n*Note: Showing first 20 rows of ${lines.length - 1} total data rows*\n`;
  }
  
  return markdown;
}

serve(sentryServe("groq-financial-analysis", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent, fileName } = await req.json();
    
    if (!csvContent) {
      throw new Error('No CSV content provided');
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    console.log('=== GROQ ANALYSIS START ===');
    console.log('📊 Analyzing CSV with Groq:', fileName);
    console.log('📄 Full CSV content being sent to Groq:');
    console.log('--- CSV START ---');
    console.log(csvContent);
    console.log('--- CSV END ---');
    console.log('📏 CSV length:', csvContent.length, 'characters');
    
    // Basic CSV validation
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('📋 CSV has', lines.length, 'lines');
    if (lines.length > 0) {
      console.log('🏷️ CSV headers:', lines[0]);
      if (lines.length > 1) {
        console.log('📝 Sample data row:', lines[1]);
      }
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-405b-reasoning',
        messages: [
          {
            role: 'system',
            content: `You are an expert financial data analyst. Your task is to analyze ONLY the CSV data provided below - do not use any external knowledge or assumptions about other financial data.

IMPORTANT: Analyze ONLY this specific CSV file. Do not make assumptions about other data or historical information.

STEP-BY-STEP ANALYSIS PROCESS:
1. First, examine the CSV structure and identify column headers
2. Look for financial data columns (revenue, sales, income, expenses, costs, profit, cash flow, etc.)
3. Parse all data rows in THIS CSV ONLY and handle currency symbols ($, €, £, etc.), commas, and number formatting
4. Sum up values across multiple rows if needed (transactions, monthly data, etc.) FROM THIS CSV ONLY
5. Calculate derived metrics (net profit = revenue - expenses, etc.) FROM THIS CSV ONLY
6. Provide your reasoning for each calculation showing your work

COLUMN IDENTIFICATION RULES:
- Revenue/Income: "revenue", "sales", "income", "gross", "turnover", "receipts", "earnings"
- Expenses/Costs: "expense", "cost", "expenditure", "spend", "outgoing", "payment", "charges"  
- Profit: "profit", "net", "margin", "surplus", "gain", "loss"
- Cash Flow: "cash flow", "cashflow", or calculate as profit

DATA PROCESSING RULES:
- Remove currency symbols ($, €, £, etc.) and commas from numbers
- Handle negative numbers properly (parentheses or minus signs)
- Sum multiple rows/transactions if present in THIS CSV
- Zero values are valid - don't ignore them
- If no clear financial data is found, return zeros with explanation

HEALTH SCORE CALCULATION (based on this document only):
- 90-100: Strong positive cash flow and profit margins
- 70-89: Good financial health with some areas for improvement  
- 50-69: Moderate health, requires attention
- 30-49: Poor financial health, significant issues
- 0-29: Critical financial situation

CRITICAL: Return ONLY valid JSON with this exact structure and analyze ONLY the provided CSV data:

{
  "totalRevenue": number,
  "totalExpenses": number, 
  "netProfit": number,
  "cashFlow": number,
  "healthScore": number,
  "documentSpecific": true,
  "reasoning": {
    "revenueCalculation": "Step-by-step explanation of how revenue was calculated from THIS CSV",
    "expenseCalculation": "Step-by-step explanation of how expenses were calculated from THIS CSV", 
    "dataRowsProcessed": "Number of data rows analyzed in THIS CSV",
    "columnsUsed": "Which specific columns were used for calculations",
    "documentAnalysis": "What this specific document contains and represents"
  },
  "insights": [
    {
      "title": "Insight specific to this document",
      "description": "Detailed description based on this document only", 
      "type": "positive|negative|neutral",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": ["Recommendations based on this specific document"],
  "summary": "Professional summary of this specific document's financial data with exact numbers found"
}

Remember: Analyze ONLY the CSV data provided below. Do not include historical data or external assumptions.`
          },
          {
            role: 'user',
            content: `Analyze this financial data converted to markdown table format for better number interpretation:

${convertCsvToMarkdownTable(csvContent)}

Return analysis as JSON only.`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error response:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📋 Raw Groq API response structure:');
    console.log('  - Response status:', response.status);
    console.log('  - Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('  - Response data:', JSON.stringify(data, null, 2));
    
    const analysisText = data.choices[0].message.content;
    console.log('🎯 Groq analysis text received:');
    console.log('--- GROQ ANALYSIS START ---');
    console.log(analysisText);
    console.log('--- GROQ ANALYSIS END ---');
    console.log('📏 Analysis text length:', analysisText.length, 'characters');

    // Try to extract and parse JSON from the response
    let analysisResult;
    try {
      console.log('🔍 Attempting to parse Groq response as JSON...');
      // First try to parse the entire response as JSON
      analysisResult = JSON.parse(analysisText);
      console.log('✅ Direct JSON parsing successful');
    } catch (directParseError) {
      console.log('❌ Direct JSON parse failed:', directParseError.message);
      console.log('🔎 Trying to extract JSON from text...');
      try {
        // Look for JSON in the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🎯 Found JSON block in response:', jsonMatch[0].substring(0, 200) + '...');
          analysisResult = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON extraction successful');
        } else {
          console.error('❌ No JSON block found in response');
          throw new Error('No JSON found in response');
        }
      } catch (extractParseError) {
        console.error('❌ JSON extraction failed:', extractParseError.message);
        console.error('🔍 Full response analysis:');
        console.error('  - Response type:', typeof analysisText);
        console.error('  - Response preview:', analysisText.substring(0, 500));
        console.error('  - Contains JSON markers:', analysisText.includes('{'), analysisText.includes('}'));
        throw new Error(`Failed to parse Groq response as JSON. Raw response: ${analysisText.substring(0, 200)}...`);
      }
    }

    // Comprehensive validation of the response structure
    console.log('🧪 Validating analysis result structure...');
    if (!analysisResult || typeof analysisResult !== 'object') {
      console.error('❌ Invalid analysis result structure:', typeof analysisResult);
      throw new Error('Invalid analysis result structure');
    }

    // Log all received values for debugging
    console.log('📊 Received financial values from Groq:');
    console.log('  - totalRevenue:', analysisResult.totalRevenue, '(type:', typeof analysisResult.totalRevenue, ')');
    console.log('  - totalExpenses:', analysisResult.totalExpenses, '(type:', typeof analysisResult.totalExpenses, ')');
    console.log('  - netProfit:', analysisResult.netProfit, '(type:', typeof analysisResult.netProfit, ')');
    console.log('  - cashFlow:', analysisResult.cashFlow, '(type:', typeof analysisResult.cashFlow, ')');
    console.log('  - healthScore:', analysisResult.healthScore, '(type:', typeof analysisResult.healthScore, ')');
    console.log('  - insights count:', analysisResult.insights?.length || 0);
    console.log('  - recommendations count:', analysisResult.recommendations?.length || 0);
    console.log('  - reasoning provided:', !!analysisResult.reasoning);

    // Ensure required fields exist and handle edge cases
    analysisResult.totalRevenue = typeof analysisResult.totalRevenue === 'number' ? analysisResult.totalRevenue : 0;
    analysisResult.totalExpenses = typeof analysisResult.totalExpenses === 'number' ? analysisResult.totalExpenses : 0;
    analysisResult.netProfit = typeof analysisResult.netProfit === 'number' ? analysisResult.netProfit : 0;
    analysisResult.cashFlow = typeof analysisResult.cashFlow === 'number' ? analysisResult.cashFlow : 0;
    analysisResult.healthScore = typeof analysisResult.healthScore === 'number' ? analysisResult.healthScore : 0;
    analysisResult.insights = Array.isArray(analysisResult.insights) ? analysisResult.insights : [];
    analysisResult.recommendations = Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations : [];
    analysisResult.summary = typeof analysisResult.summary === 'string' ? analysisResult.summary : 'Analysis completed';

    console.log('🔧 Final processed values:');
    console.log('  - totalRevenue:', analysisResult.totalRevenue);
    console.log('  - totalExpenses:', analysisResult.totalExpenses);
    console.log('  - netProfit:', analysisResult.netProfit);
    console.log('  - cashFlow:', analysisResult.cashFlow);
    console.log('  - healthScore:', analysisResult.healthScore);
    console.log('=== GROQ ANALYSIS END ===');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in Groq financial analysis:', error);
    console.error('📍 Error details:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));