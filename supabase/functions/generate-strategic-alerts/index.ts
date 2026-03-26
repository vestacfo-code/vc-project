// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRATEGIC-ALERTS] ${step}${detailsStr}`);
};

// Generate fallback alerts when AI parsing fails
const generateFallbackAlerts = (finData: any[]) => {
  const alerts: any[] = [];

  if (Array.isArray(finData) && finData.length > 0) {
    // Basic aggregates
    const totalRevenue = finData.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
    const totalExpenses = finData.reduce((sum, r) => sum + (Number(r.expenses) || 0), 0);
    const totalProfit = finData.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
    const avgCashFlow = finData.reduce((sum, r) => sum + (Number(r.cash_flow) || 0), 0) / finData.length;

    // Trend analysis using the two most recent records (finData is sorted desc)
    const latest = finData[0];
    const prev = finData[1];

    const mkNum = (v: any) => Number(v) || 0;

    if (prev) {
      const revNow = mkNum(latest.revenue);
      const revPrev = mkNum(prev.revenue);
      const revChangePct = revPrev !== 0 ? ((revNow - revPrev) / Math.abs(revPrev)) * 100 : (revNow !== 0 ? 100 : 0);

      if (revChangePct <= -5) {
        alerts.push({
          title: "Revenue is declining",
          message: `Revenue decreased ${revChangePct.toFixed(1)}% vs. the prior period. Investigate pipeline, pricing, and churn. Consider targeted promotions or sales enablement to recover growth.`,
          severity: Math.abs(revChangePct) > 20 ? "critical" : "warning",
          type: "revenue_trend",
        });
      } else if (revChangePct >= 5) {
        alerts.push({
          title: "Revenue trending up",
          message: `Revenue increased ${revChangePct.toFixed(1)}% vs. the prior period. Double-down on what’s working and ensure ops can support sustained growth.`,
          severity: "info",
          type: "revenue_trend",
        });
      }

      const profitNow = mkNum(latest.profit ?? (mkNum(latest.revenue) - mkNum(latest.expenses)));
      const profitPrev = mkNum(prev.profit ?? (mkNum(prev.revenue) - mkNum(prev.expenses)));
      const profitChangePct = profitPrev !== 0 ? ((profitNow - profitPrev) / Math.abs(profitPrev)) * 100 : (profitNow !== 0 ? 100 : 0);

      if (profitChangePct <= -5) {
        alerts.push({
          title: "Profit under pressure",
          message: `Profit fell ${profitChangePct.toFixed(1)}% vs. the prior period. Review COGS/opex, adjust pricing or discounting, and defer non-essential spend.`,
          severity: Math.abs(profitChangePct) > 20 ? "critical" : "warning",
          type: "profit_trend",
        });
      } else if (profitChangePct >= 5) {
        alerts.push({
          title: "Profitability improving",
          message: `Profit improved ${profitChangePct.toFixed(1)}% vs. the prior period. Maintain cost discipline and invest selectively in high-ROI initiatives.`,
          severity: "info",
          type: "profit_trend",
        });
      }

      const cfNow = mkNum(latest.cash_flow);
      const cfPrev = mkNum(prev.cash_flow);
      const cfChangePct = cfPrev !== 0 ? ((cfNow - cfPrev) / Math.abs(cfPrev)) * 100 : (cfNow !== 0 ? 100 : 0);

      if (cfNow < 0) {
        alerts.push({
          title: "Negative cash flow detected",
          message: `Latest cash flow is negative (${cfNow.toLocaleString()}). Accelerate receivables, tighten payment terms, and prioritize high-margin revenue.`,
          severity: "warning",
          type: "cash_flow",
        });
      }

      if (cfChangePct <= -5) {
        alerts.push({
          title: "Cash flow worsening",
          message: `Cash flow declined ${cfChangePct.toFixed(1)}%. Revisit working capital, inventory turns, and billing cadence.`,
          severity: Math.abs(cfChangePct) > 20 ? "critical" : "warning",
          type: "cash_flow_trend",
        });
      } else if (cfChangePct >= 5) {
        alerts.push({
          title: "Cash flow improving",
          message: `Cash flow improved ${cfChangePct.toFixed(1)}%. Consider allocating surplus to reserves or strategic growth bets.`,
          severity: "info",
          type: "cash_flow_trend",
        });
      }
    }

    // Profit margin signal
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    if (profitMargin < 10) {
      alerts.push({
        title: "Low profit margin",
        message: "Profit margin is below 10%. Audit costs, refine pricing tiers, and focus on high-contribution products/services.",
        severity: "warning",
        type: "profitability",
      });
    } else if (profitMargin > 20) {
      alerts.push({
        title: "Strong profitability",
        message: "Profit margin exceeds 20%. Preserve efficiency and scale what’s driving margin outperformance.",
        severity: "info",
        type: "profitability",
      });
    }

    // Average cash flow signal
    if (avgCashFlow !== 0) {
      alerts.push({
        title: avgCashFlow > 0 ? "Consistently positive cash flow" : "Consistently negative cash flow",
        message: avgCashFlow > 0
          ? "Average cash flow is positive. Maintain discipline and explore prudent growth investments."
          : "Average cash flow is negative. Improve collections, adjust spend timing, and review discretionary expenses.",
        severity: avgCashFlow > 0 ? "info" : "warning",
        type: "cash_flow_average",
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      title: "Financial data analyzed",
      message: "Your financial data was processed. Keep monitoring revenue, profit, and cash flow trends.",
      severity: "info",
      type: "general_analysis",
    });
  }

  return alerts;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's financial data
    const { data: finData, error: finError } = await supabaseClient
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (finError) throw finError;
    logStep("Financial data retrieved", { recordCount: finData?.length || 0 });

    // Get user's profile for context
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    logStep("Profile data retrieved", { hasProfile: !!profileData });

    // Prepare context for AI analysis
    let analysisContext = "Financial Data Analysis for Strategic Alerts:\n\n";
    
    if (finData && finData.length > 0) {
      const totalRevenue = finData.reduce((sum, record) => sum + (record.revenue || 0), 0);
      const totalExpenses = finData.reduce((sum, record) => sum + (record.expenses || 0), 0);
      const avgCashFlow = finData.reduce((sum, record) => sum + (record.cash_flow || 0), 0) / finData.length;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

      analysisContext += `Financial Summary:\n`;
      analysisContext += `- Total Revenue: $${totalRevenue.toLocaleString()}\n`;
      analysisContext += `- Total Expenses: $${totalExpenses.toLocaleString()}\n`;
      analysisContext += `- Average Cash Flow: $${avgCashFlow.toLocaleString()}\n`;
      analysisContext += `- Profit Margin: ${profitMargin.toFixed(1)}%\n\n`;
    }

    if (profileData) {
      analysisContext += `Business Context:\n`;
      analysisContext += `- Company: ${profileData.company_name || 'Not specified'}\n`;
      analysisContext += `- Industry: ${profileData.industry || 'Not specified'}\n`;
      analysisContext += `- Company Size: ${profileData.company_size || 'Not specified'}\n`;
      analysisContext += `- Business Type: ${profileData.business_type || 'Not specified'}\n\n`;
    }

// Check if we have OpenAI API key, if not use Groq
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY');

logStep("AI analysis starting", { hasOpenAI: !!openaiApiKey, hasGroq: !!groqApiKey });

let alerts: any[] | undefined;

if (!openaiApiKey && !groqApiKey) {
  // No AI keys configured — fall back to deterministic, trend-based alerts
  logStep("No AI key available, using fallback alerts");
  alerts = generateFallbackAlerts(finData);
} else {
  try {
    let response;
    if (openaiApiKey) {
      // Use OpenAI
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a strategic business advisor AI. Analyze the provided financial data and generate 2-4 strategic alerts for the business owner. Each alert should be actionable and specific to their situation.

For each alert, provide:
1. A clear, concise title
2. A detailed message explaining the situation and recommended action
3. A severity level: "info" (opportunities/positive trends), "warning" (needs attention), or "critical" (urgent action required)
4. An alert type (e.g., "cash_flow", "profitability", "expense_management", "growth_opportunity", "risk_assessment")

Return ONLY a JSON array of alerts in this exact format (no markdown, no extra text):
[
  {
    "title": "Alert Title",
    "message": "Detailed explanation and recommended action...",
    "severity": "info",
    "type": "alert_type"
  }
]

Focus on insights that are:
- Specific to their financial situation
- Actionable with clear next steps
- Industry-relevant when possible
- Time-sensitive or trend-based`
            },
            { role: 'user', content: analysisContext }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
    } else {
      // Use Groq
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a strategic business advisor AI. Analyze the provided financial data and generate 2-4 strategic alerts for the business owner. Each alert should be actionable and specific to their situation.

For each alert, provide:
1. A clear, concise title
2. A detailed message explaining the situation and recommended action
3. A severity level: "info" (opportunities/positive trends), "warning" (needs attention), or "critical" (urgent action required)
4. An alert type (e.g., "cash_flow", "profitability", "expense_management", "growth_opportunity", "risk_assessment")

Return ONLY a JSON array of alerts in this exact format (no markdown, no extra text):
[
  {
    "title": "Alert Title",
    "message": "Detailed explanation and recommended action...",
    "severity": "info",
    "type": "alert_type"
  }
]

Focus on insights that are:
- Specific to their financial situation
- Actionable with clear next steps
- Industry-relevant when possible
- Time-sensitive or trend-based`
            },
            { role: 'user', content: analysisContext }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
    }

    if (!response.ok) {
      logStep("AI API request failed, switching to fallback", { status: response.status });
      alerts = generateFallbackAlerts(finData);
    } else {
      const aiData = await response.json();
      logStep("AI response received", { hasChoices: !!aiData.choices?.[0] });

      let alertsContent = aiData.choices?.[0]?.message?.content;
      if (!alertsContent) {
        logStep("Empty AI content, using fallback alerts");
        alerts = generateFallbackAlerts(finData);
      } else {
        // Parse the JSON response with resilience
        try {
          alertsContent = alertsContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = alertsContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) alertsContent = jsonMatch[0];
          alerts = JSON.parse(alertsContent);
          logStep("JSON parsing successful", { alertCount: alerts.length });
        } catch (parseError) {
          logStep("JSON parsing failed, attempting secondary extraction", { error: (parseError as Error).message });
          try {
            const alertsRegex = /\[\s*{[\s\S]*?}\s*\]/;
            const match = alertsContent.match(alertsRegex);
            if (match) {
              alerts = JSON.parse(match[0]);
              logStep("Secondary JSON parsing successful");
            } else {
              throw new Error("No JSON array found");
            }
          } catch (secondaryError) {
            logStep("Secondary parsing failed, using fallback alerts", { error: (secondaryError as Error).message });
            alerts = generateFallbackAlerts(finData);
          }
        }
      }
    }
  } catch (aiError) {
    logStep("AI call errored, using fallback alerts", { error: aiError instanceof Error ? aiError.message : String(aiError) });
    alerts = generateFallbackAlerts(finData);
  }
}

// Assure we have some alerts
if (!alerts || alerts.length === 0) {
  alerts = generateFallbackAlerts(finData);
}

logStep("Alerts parsed", { alertCount: alerts.length });

    // Save alerts to database
    const alertsToInsert = alerts.map((alert: any) => ({
      user_id: user.id,
      type: alert.type || 'ai_generated',
      title: alert.title,
      message: alert.message,
      severity: alert.severity || 'info',
      is_read: false
    }));

    const { error: insertError } = await supabaseClient
      .from('alerts')
      .insert(alertsToInsert);

    if (insertError) throw insertError;

    // Create notifications for each alert
    const notifications = alertsToInsert.map(alert => ({
      user_id: alert.user_id,
      type: 'strategic_alert',
      title: alert.title,
      message: alert.message,
      data: { severity: alert.severity, alert_type: alert.type }
    }));

    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      logStep("Warning: Failed to create notifications", { error: notificationError.message });
    }

    logStep("Alerts saved successfully", { alertCount: alerts.length });

    return new Response(JSON.stringify({ 
      success: true, 
      alertsGenerated: alerts.length,
      alerts: alerts 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-strategic-alerts", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});