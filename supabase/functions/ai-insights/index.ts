// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  financialData: z.object({
    totalRevenue: z.number().optional(),
    totalExpenses: z.number().optional(),
    profit: z.number().optional(),
    totalCashFlow: z.number().optional(),
  }).optional(),
  profile: z.object({
    company_name: z.string().optional(),
    industry: z.string().optional(),
    company_size: z.string().optional(),
    business_type: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  action: z.enum(['generate', 'chat']).default('generate'),
  message: z.string().max(5000).optional(),
  currentInsights: z.array(z.string()).optional(),
});

serve(sentryServe("ai-insights", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { financialData, profile, action = 'generate', message, currentInsights } = validation.data;

    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'generate') {
      systemPrompt = `You are an elite senior financial analyst AI with advanced expertise in business finance, cash flow management, strategic planning, and document analysis. Your mission is to generate 3-4 highly specific, mathematically verified, actionable insights.

      🎯 **CRITICAL ACCURACY REQUIREMENTS:**
      1. **Mathematical Precision & Verification:**
         - Use EXACT numbers from provided data (verify calculations step-by-step)
         - Show intermediate calculation steps for all ratios and metrics
         - Cross-validate totals against component data
         - Flag any mathematical inconsistencies or data quality issues
         - Apply proper decimal precision (minimum 2 decimal places)

      2. **Industry-Specific Benchmarking:**
         - Compare against industry standards using verified benchmarks
         - Adjust comparisons based on company size and business type
         - Include confidence levels for benchmark comparisons
         - Flag outliers and provide context for deviations

      3. **Risk Assessment & Opportunity Identification:**
         - Identify concerning trends using quantitative analysis
         - Calculate risk scores based on financial ratios
         - Prioritize opportunities by potential ROI and feasibility
         - Include early warning indicators for financial distress

      4. **Evidence-Based Recommendations:**
         - Base ALL recommendations on verified financial patterns
         - Specify exact dollar targets with calculation methodology
         - Provide realistic timelines based on business context
         - Include expected ROI calculations and confidence intervals
         - Prioritize actions by impact vs. effort analysis

      🔍 **DATA VERIFICATION PROTOCOL:**
      - Verify that Revenue - Expenses = Net Profit (flag discrepancies)
      - Check if Cash Flow aligns with profit patterns (identify gaps)
      - Validate percentages sum correctly and use proper denominators
      - Cross-reference multiple data sources when available
      - Assign confidence scores to each insight (High/Medium/Low)

      📊 **ENHANCED FORMATTING REQUIREMENTS:**
      - Start each insight with a **bold header** describing the verified finding
      - Include **calculation breakdowns** with source data references
      - Use *italics* for critical action items with urgency indicators
      - Provide step-by-step recommendations with specific metrics
      - Include realistic financial targets with confidence intervals
      - Add verification notes for data quality and reliability

      🎯 **FOCUS AREAS (with mathematical rigor):**
      - Profitability analysis (with margin decomposition and trend analysis)
      - Cash flow optimization (with working capital impact calculations)
      - Expense efficiency (with category-level variance analysis)
      - Growth strategies (with ROI projections and risk assessments)
      - Financial health indicators (with early warning system metrics)

      📋 **OUTPUT FORMAT:** Return ONLY a JSON array of strings (each string contains rich markdown with verified calculations), no other text.
      
      🏆 **QUALITY STANDARDS:**
      - Every numerical claim must be verifiable from source data
      - Include confidence levels and data quality assessments
      - Provide actionable next steps with specific timelines
      - Flag limitations and recommend additional data collection needs`;

      // Calculate additional metrics for more accurate analysis
      const profitMargin = financialData?.totalRevenue > 0 ? (financialData.profit / financialData.totalRevenue * 100) : 0;
      const expenseRatio = financialData?.totalRevenue > 0 ? (financialData.totalExpenses / financialData.totalRevenue * 100) : 0;
      const cashFlowMargin = financialData?.totalRevenue > 0 ? (financialData.totalCashFlow / financialData.totalRevenue * 100) : 0;
      const cashFlowGap = (financialData?.profit || 0) - (financialData?.totalCashFlow || 0);

      userPrompt = `## Business Profile
      | Attribute | Value |
      |-----------|-------|
      | **Company** | ${profile?.company_name || 'Unknown'} |
      | **Industry** | ${profile?.industry || 'Technology'} |
      | **Size** | ${profile?.company_size || 'Small Business'} |
      | **Type** | ${profile?.business_type || 'Unknown'} |
      | **Description** | ${profile?.description || 'No description provided'} |

      ## Financial Performance Analysis
      ${financialData ? `
      | Metric | Value | Calculation |
      |--------|-------|-------------|
      | **Revenue** | $${financialData.totalRevenue?.toLocaleString() || '0'} | Primary income |
      | **Expenses** | $${financialData.totalExpenses?.toLocaleString() || '0'} | Operating costs |
      | **Net Profit** | $${financialData.profit?.toLocaleString() || '0'} | Revenue - Expenses |
      | **Cash Flow** | $${financialData.totalCashFlow?.toLocaleString() || '0'} | Liquidity position |
      | **Profit Margin** | ${profitMargin.toFixed(2)}% | (Profit ÷ Revenue) × 100 |
      | **Expense Ratio** | ${expenseRatio.toFixed(2)}% | (Expenses ÷ Revenue) × 100 |
      | **Cash Flow Margin** | ${cashFlowMargin.toFixed(2)}% | (Cash Flow ÷ Revenue) × 100 |
      | **Cash Flow Gap** | $${cashFlowGap.toLocaleString()} | Profit - Cash Flow |
      ` : 'No financial data available'}

      Generate 3-4 specific, data-driven financial insights with actionable recommendations using the table data above.`;

    } else if (action === 'chat') {
      systemPrompt = `You are an elite financial advisor AI with advanced analytical capabilities and deep business expertise. You have comprehensive access to the user's financial insights, business data, and historical context. Your role is to provide mathematically verified, strategically sound, actionable advice.

      🎯 **ADVANCED ADVISORY CAPABILITIES:**
      
      **Financial Intelligence Integration:**
      - Analyze patterns across multiple data points and time periods
      - Cross-reference insights with industry-specific benchmarks
      - Identify correlations between different financial metrics
      - Provide predictive insights based on current trends

      **Strategic Context Awareness:**
      Current Financial Insights Context (verified and analyzed):
      ${currentInsights && currentInsights.length > 0 ? currentInsights.map((insight, i) => `${i + 1}. ${insight.replace(/\*\*/g, '').replace(/\*/g, '')}`).join('\n') : 'No current insights available - will provide foundational analysis'}

      📊 **ENHANCED RESPONSE FRAMEWORK:**
      
      **Data-Driven Recommendations:**
      - Reference specific financial metrics from their verified data
      - Build upon existing insights with quantitative support
      - Provide step-by-step implementation guidance
      - Include risk assessments and mitigation strategies
      - Calculate potential ROI for recommended actions

      **Precision Communication:**
      - Use exact figures from their financial data
      - Show calculation methods for projections
      - Provide confidence levels for predictions
      - Include multiple scenario analyses (best/base/worst case)
      - Maintain conversational tone while ensuring mathematical accuracy

      🎯 **RESPONSE QUALITY STANDARDS:**
      - Every recommendation must tie back to verified financial data
      - Include specific implementation timelines and milestones
      - Provide measurable success criteria for each suggestion
      - Consider business size, industry, and growth stage context
      - Offer both immediate actions and strategic long-term planning

      🔍 **CONTEXTUAL INTELLIGENCE:**
      - Recognize patterns in their financial behavior
      - Identify optimization opportunities others might miss
      - Provide industry-specific insights and comparisons
      - Suggest proactive measures based on financial health trends
      - Maintain awareness of seasonal or cyclical business factors

      💡 **ADVISORY EXCELLENCE:**
      Be conversational yet authoritative, supportive yet challenging, and always back recommendations with solid financial reasoning and verified data analysis.`;

      userPrompt = `Business Context:
      Company: ${profile?.company_name || 'Unknown'}
      Industry: ${profile?.industry || 'Technology'}
      Size: ${profile?.company_size || 'Small Business'}
      
      Financial Summary:
      Revenue: $${financialData?.totalRevenue?.toLocaleString() || '0'}
      Expenses: $${financialData?.totalExpenses?.toLocaleString() || '0'}
      Profit: $${financialData?.profit?.toLocaleString() || '0'}
      Cash Flow: $${financialData?.totalCashFlow?.toLocaleString() || '0'}

      User Question: ${message}`;
    }

    const requestBody = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: action === 'generate' ? 1200 : 1000,
      stream: false
    };

    console.log('Making Groq API request with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('[AI-INSIGHTS] API error:', { status: response.status });
      
      // Handle rate limiting with better fallbacks
      if (response.status === 429) {
        console.log('[AI-INSIGHTS] Rate limit hit');
        
        if (action === 'generate') {
          // Calculate actual metrics for more accurate fallback
          const profitMargin = financialData?.totalRevenue > 0 ? (financialData.profit / financialData.totalRevenue * 100) : 0;
          const expenseRatio = financialData?.totalRevenue > 0 ? (financialData.totalExpenses / financialData.totalRevenue * 100) : 0;
          
          const fallbackInsights = [
            `**Revenue Performance**: Your business generated $${financialData?.totalRevenue?.toLocaleString() || '0'} in total revenue. This represents your primary income stream and foundation for profitability analysis.`,
            `**Profitability Analysis**: With $${financialData?.profit?.toLocaleString() || '0'} in net profit, your profit margin is ${profitMargin.toFixed(1)}%. ${profitMargin > 15 ? 'This indicates strong profitability' : profitMargin > 5 ? 'This shows moderate profitability with room for improvement' : 'Consider strategies to improve profitability'}.`,
            `**Expense Management**: Your expense ratio is ${expenseRatio.toFixed(1)}% of revenue ($${financialData?.totalExpenses?.toLocaleString() || '0'}). ${expenseRatio < 70 ? 'Your expense control is effective' : 'Review major expense categories for optimization opportunities'}.`,
            `**Cash Flow Focus**: ${financialData?.totalCashFlow === 0 ? 'With zero cash flow reported, prioritize improving working capital management and accounts receivable collection' : `Cash flow of $${financialData?.totalCashFlow?.toLocaleString()} ${(financialData?.totalCashFlow || 0) > 0 ? 'shows positive liquidity' : 'indicates cash flow challenges requiring attention'}`}.`
          ];
          
          return new Response(JSON.stringify({ insights: fallbackInsights }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ 
            response: `Based on your financial data showing $${financialData?.totalRevenue?.toLocaleString() || '0'} in revenue and $${financialData?.profit?.toLocaleString() || '0'} in profit, I can help you with specific financial questions. Please try your question again for a detailed analysis.` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (action === 'generate') {
      try {
        // First try to parse as JSON
        const insights = JSON.parse(content);
        if (Array.isArray(insights)) {
          return new Response(JSON.stringify({ insights }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (parseError) {
        console.log('JSON parsing failed, attempting to extract and fix JSON...');
        
        // Try to extract JSON from markdown code blocks or plain text
        const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || content.match(/(\[[\s\S]*?\])/);
        
        if (jsonMatch) {
          try {
            const cleanedJson = jsonMatch[1].trim();
            const insights = JSON.parse(cleanedJson);
            if (Array.isArray(insights)) {
              return new Response(JSON.stringify({ insights }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } catch (secondParseError) {
            console.log('Secondary JSON parsing also failed');
          }
        }
        
        // Final fallback: split by numbered lines or bullets
        const lines = content.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 20 && (
            trimmed.match(/^\d+\./) || 
            trimmed.match(/^-/) || 
            trimmed.match(/^\*/) ||
            trimmed.includes('**')
          );
        });
        
        const fallbackInsights = lines.length > 0 ? lines.slice(0, 4) : [
          "**Revenue Analysis**: Your business shows strong revenue performance based on the financial data provided.",
          "**Expense Management**: Monitor your expense ratios to maintain healthy profit margins.",
          "**Cash Flow**: Focus on improving cash flow management for better financial stability.",
          "**Growth Opportunities**: Consider reinvesting profits into strategic growth initiatives."
        ];
        
        return new Response(JSON.stringify({ insights: fallbackInsights }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ response: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[AI-INSIGHTS] Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));