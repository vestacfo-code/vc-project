// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(sentryServe("financial-analysis", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { financialData, userId, documentId } = await req.json();
    console.log('Enhanced financial analysis request:', { financialData, userId, documentId });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if analysis already exists for this document
    if (documentId) {
      const { data: existingAnalysis } = await supabase
        .from('documents')
        .select('metadata')
        .eq('id', documentId)
        .single();
      
      if (existingAnalysis?.metadata?.analysis) {
        console.log('Returning cached analysis for document:', documentId);
        return new Response(JSON.stringify(existingAnalysis.metadata.analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const revenue = financialData.revenue || 0;
    const expenses = financialData.expenses || 0;
    const cashFlow = financialData.cashFlow || 0;
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get historical data for context
    const { data: historicalScores } = await supabase
      .from('business_health_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Enhanced Groq AI analysis with better prompting
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    console.log('Financial Analysis - GROQ_API_KEY found:', !!groqApiKey);
    
    let analysis = null;
    
    if (groqApiKey) {
      try {
        let businessContext = "No business profile available";
        if (profile) {
          businessContext = `Business Profile:
- Company: ${profile.company_name || 'Not specified'}
- Industry: ${profile.industry || 'Not specified'}  
- Size: ${profile.company_size || 'Not specified'}
- Type: ${profile.business_type || 'Not specified'}
- Description: ${profile.description || 'No description'}`;
        }

        let historicalContext = "No historical data available";
        if (historicalScores && historicalScores.length > 0) {
          const avgScore = historicalScores.reduce((sum, s) => sum + s.score, 0) / historicalScores.length;
          const trend = historicalScores.length > 1 
            ? (historicalScores[0].score > historicalScores[1].score ? 'improving' : 'declining')
            : 'stable';
          
          historicalContext = `Historical Performance:
- Average Health Score: ${avgScore.toFixed(1)}/100
- Recent Trend: ${trend}
- Previous Analysis: ${historicalScores[0]?.ai_explanation || 'None'}`;
        }

        console.log('Calling enhanced Groq API for financial analysis...');
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are an expert financial analyst AI providing comprehensive business insights. 

Analyze the financial data with industry-specific expertise and historical context. Be specific, actionable, and insightful.

CRITICAL: Format your response as valid JSON with these exact fields:
{
  "summary": "2-sentence executive summary tailored to this specific business",
  "insights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "healthScore": number_between_0_and_100,
  "riskFactors": ["risk 1", "risk 2"]
}

Guidelines:
- Reference actual numbers and percentages
- Provide industry-specific benchmarks when possible
- Consider the business context (size, industry, type)
- Include historical trend analysis if available
- Be actionable and specific, not generic
- Use professional financial terminology
- Focus on practical next steps`
              },
              {
                role: "user",
                content: `${businessContext}

${historicalContext}

## Financial Performance Summary

| Metric | Value | Analysis |
|--------|--------|----------|
| **Total Revenue** | $${revenue.toLocaleString()} | Primary income source |
| **Total Expenses** | $${expenses.toLocaleString()} | Operating costs |
| **Net Profit** | $${profit.toLocaleString()} | Bottom line result |
| **Cash Flow** | $${cashFlow.toLocaleString()} | Liquidity position |
| **Profit Margin** | ${profitMargin.toFixed(1)}% | Efficiency indicator |

Additional Context: ${financialData.userContext || 'No additional context'}
Document Context: ${financialData.documentName || 'General analysis'}

Provide a comprehensive financial health analysis with specific insights for this business using the table data above.`
              }
            ],
            temperature: 0.3,
            max_tokens: 1800,
          }),
        });

        console.log('Groq API response status:', groqResponse.status);
        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          console.log('Groq response received:', groqData);
          try {
            const content = groqData.choices[0].message.content;
            console.log('Raw Groq content:', content);
            analysis = JSON.parse(content);
            console.log("Successfully parsed Groq AI analysis:", analysis);
          } catch (parseError) {
            console.error("Failed to parse Groq response:", parseError);
            console.log("Raw content that failed to parse:", groqData.choices[0].message.content);
            throw new Error("Parse failed");
          }
        } else {
          const errorText = await groqResponse.text();
          console.error('Groq API failed:', groqResponse.status, errorText);
          throw new Error(`Groq API failed: ${groqResponse.status} - ${errorText}`);
        }
      } catch (groqError) {
        console.log("Groq failed, using fallback analysis:", groqError.message);
      }
    }
    
    // Fallback to smart rule-based analysis if Groq fails or isn't configured
    if (!analysis) {
      let healthScore = 50;
      if (profitMargin > 20) healthScore += 25;
      else if (profitMargin > 10) healthScore += 15;
      else if (profitMargin > 0) healthScore += 10;
      else healthScore -= 20;
      
      if (cashFlow > 0) healthScore += 15;
      else if (cashFlow < 0) healthScore -= 15;
      
      const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;
      if (expenseRatio < 80) healthScore += 10;
      else if (expenseRatio > 90) healthScore -= 10;
      
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      const insights = [];
      const recommendations = [];
      const riskFactors = [];
      
      if (profitMargin > 15) {
        insights.push("Strong profit margins indicate excellent operational efficiency");
        recommendations.push("Consider reinvesting profits into growth opportunities");
      } else if (profitMargin > 5) {
        insights.push("Moderate profitability with room for improvement");
        recommendations.push("Analyze cost structure to identify optimization opportunities");
      } else if (profitMargin > 0) {
        insights.push("Low profit margins require immediate attention");
        recommendations.push("Focus on reducing operational costs and improving pricing strategy");
        riskFactors.push("Thin profit margins leave little room for unexpected expenses");
      } else {
        insights.push("Operating at a loss - urgent action required");
        recommendations.push("Implement cost reduction measures immediately");
        riskFactors.push("Negative profitability threatens business sustainability");
      }
      
      if (cashFlow > revenue * 0.1) {
        insights.push("Healthy cash flow provides good operational flexibility");
      } else if (cashFlow > 0) {
        insights.push("Positive but limited cash flow");
        recommendations.push("Monitor cash flow trends closely");
      } else {
        insights.push("Negative cash flow indicates potential liquidity issues");
        riskFactors.push("Poor cash flow management could impact operations");
      }
      
      let summary = "";
      if (healthScore >= 80) {
        summary = "Your business shows strong financial health with solid profitability and cash flow. Continue monitoring key metrics while exploring growth opportunities.";
      } else if (healthScore >= 60) {
        summary = "Moderate financial performance with some areas for improvement. Focus on optimizing costs and enhancing revenue streams.";
      } else if (healthScore >= 40) {
        summary = "Financial performance needs attention. Consider implementing cost control measures and reviewing your business strategy.";
      } else {
        summary = "Critical financial situation requiring immediate action. Focus on cash flow management and cost reduction to stabilize operations.";
      }
      
      analysis = {
        summary,
        insights: insights.length > 0 ? insights : ["Financial analysis completed based on current data"],
        recommendations: recommendations.length > 0 ? recommendations : ["Continue monitoring financial performance regularly"],
        healthScore: Math.round(healthScore),
        riskFactors: riskFactors.length > 0 ? riskFactors : ["Monitor market conditions and operational efficiency"]
      };
    }

    // Store enhanced analysis results with document association
    try {
      const healthScoreData = {
        user_id: userId,
        score: analysis.healthScore,
        ai_explanation: analysis.summary,
        factors: {
          insights: analysis.insights,
          recommendations: analysis.recommendations,
          riskFactors: analysis.riskFactors,
          metrics: {
            revenue,
            expenses,
            profit,
            cashFlow,
            profitMargin: profitMargin.toFixed(2)
          }
        }
      };

      await supabase.from('business_health_scores').insert(healthScoreData);

      // Store analysis in document metadata if documentId provided
      if (documentId) {
        const { data: document } = await supabase
          .from('documents')
          .select('metadata')
          .eq('id', documentId)
          .single();

        const updatedMetadata = {
          ...document?.metadata,
          analysis: analysis,
          analysisDate: new Date().toISOString()
        };

        await supabase
          .from('documents')
          .update({ metadata: updatedMetadata })
          .eq('id', documentId);

        console.log('Analysis stored in document metadata');
      }

      console.log('Enhanced business health score saved successfully');
    } catch (dbError) {
      console.error('Failed to save enhanced analysis results:', dbError);
      // Don't fail the entire request if database save fails
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in financial-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});