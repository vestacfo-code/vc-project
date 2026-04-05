// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { getResendFrom, getResendReplyTo } from "../_shared/resend.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeeklyReportRequest {
  userId: string;
  weekStartDate?: string;
  sendEmail?: boolean;
}

const generateWeeklyReport = async (userId: string, weekStartDate?: string) => {
  // Calculate date range (last 7 days if not specified)
  const endDate = weekStartDate ? new Date(weekStartDate) : new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  console.log(`[WEEKLY REPORT] Generating for user ${userId}, ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Fetch financial data for the week
  const { data: weeklyData, error: weeklyError } = await supabase
    .from('financial_data')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (weeklyError) throw weeklyError;

  // Fetch previous week's data for comparison
  const prevWeekStart = new Date(startDate);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const { data: prevWeekData } = await supabase
    .from('financial_data')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', prevWeekStart.toISOString())
    .lt('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get latest business health score
  const { data: healthScore } = await supabase
    .from('business_health_scores')
    .select('score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Calculate metrics
  const calculateMetrics = (data: any[]) => {
    if (!data || data.length === 0) return { revenue: 0, expenses: 0, profit: 0, cashFlow: 0 };
    return {
      revenue: data.reduce((sum, r) => sum + (r.revenue || 0), 0),
      expenses: data.reduce((sum, r) => sum + (r.expenses || 0), 0),
      profit: data.reduce((sum, r) => sum + ((r.profit || 0) || (r.revenue - r.expenses)), 0),
      cashFlow: data.reduce((sum, r) => sum + (r.cash_flow || 0), 0),
    };
  };

  const thisWeek = calculateMetrics(weeklyData);
  const lastWeek = calculateMetrics(prevWeekData);

  // Calculate changes
  const changes = {
    revenue: lastWeek.revenue ? ((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100 : 0,
    expenses: lastWeek.expenses ? ((thisWeek.expenses - lastWeek.expenses) / lastWeek.expenses) * 100 : 0,
    profit: lastWeek.profit ? ((thisWeek.profit - lastWeek.profit) / Math.abs(lastWeek.profit)) * 100 : 0,
    cashFlow: lastWeek.cashFlow ? ((thisWeek.cashFlow - lastWeek.cashFlow) / Math.abs(lastWeek.cashFlow)) * 100 : 0,
  };

  // Generate AI-enhanced insights
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  let aiInsights = '';

  if (groqApiKey && weeklyData && weeklyData.length > 0) {
    try {
      const prompt = `Generate a concise weekly financial report summary for ${profile?.company_name || 'the business'}.

Financial Summary:
- Revenue: $${thisWeek.revenue.toLocaleString()} (${changes.revenue >= 0 ? '+' : ''}${changes.revenue.toFixed(1)}% vs last week)
- Expenses: $${thisWeek.expenses.toLocaleString()} (${changes.expenses >= 0 ? '+' : ''}${changes.expenses.toFixed(1)}% vs last week)
- Profit: $${thisWeek.profit.toLocaleString()} (${changes.profit >= 0 ? '+' : ''}${changes.profit.toFixed(1)}% vs last week)
- Cash Flow: $${thisWeek.cashFlow.toLocaleString()} (${changes.cashFlow >= 0 ? '+' : ''}${changes.cashFlow.toFixed(1)}% vs last week)
- Business Health Score: ${healthScore?.score || 'N/A'}/100

Industry: ${profile?.industry || 'Not specified'}
Business Type: ${profile?.business_type || 'Not specified'}

Provide:
1. Executive summary (2-3 sentences)
2. Key highlights (3-4 bullet points)
3. Strategic recommendations (2-3 actionable items)
4. Areas needing attention (if any)

Keep it professional, actionable, and concise.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: 'You are a financial analyst providing weekly business reports.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiInsights = data.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('[WEEKLY REPORT] AI generation error:', error);
    }
  }

  // Generate report content (plain text for notification)
  const reportTitle = `Weekly Financial Report - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  const reportMessage = `
${aiInsights || `Weekly financial summary for ${profile?.company_name || 'your business'}:`}

📊 **This Week's Performance:**
• Revenue: $${thisWeek.revenue.toLocaleString()} (${changes.revenue >= 0 ? '↑' : '↓'} ${Math.abs(changes.revenue).toFixed(1)}%)
• Expenses: $${thisWeek.expenses.toLocaleString()} (${changes.expenses >= 0 ? '↑' : '↓'} ${Math.abs(changes.expenses).toFixed(1)}%)
• Profit: $${thisWeek.profit.toLocaleString()} (${changes.profit >= 0 ? '↑' : '↓'} ${Math.abs(changes.profit).toFixed(1)}%)
• Cash Flow: $${thisWeek.cashFlow.toLocaleString()} (${changes.cashFlow >= 0 ? '↑' : '↓'} ${Math.abs(changes.cashFlow).toFixed(1)}%)
• Health Score: ${healthScore?.score || 'N/A'}/100

${!aiInsights ? '📈 Keep monitoring your financial trends and maintaining healthy cash flow.' : ''}
  `.trim();

  return {
    title: reportTitle,
    message: reportMessage,
    aiInsights,
    data: {
      thisWeek,
      lastWeek,
      changes,
      healthScore: healthScore?.score,
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
      companyName: profile?.company_name,
    }
  };
};

const getEmailHtml = (report: any, userName: string) => {
  const { title, aiInsights, data } = report;
  const { thisWeek, changes, healthScore, weekStart, weekEnd, companyName } = data;

  const formatCurrency = (num: number) => `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatChange = (change: number) => {
    const arrow = change >= 0 ? '↑' : '↓';
    const color = change >= 0 ? '#22c55e' : '#ef4444';
    return `<span style="color: ${color};">${arrow} ${Math.abs(change).toFixed(1)}%</span>`;
  };

  const startDateStr = new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDateStr = new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Financial Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden;">
      <!-- Header -->
      <div style="background-color: #1a1a1a; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Vesta</h1>
        <p style="color: #a0a0a0; margin: 8px 0 0 0; font-size: 14px;">Your Weekly Financial Insights</p>
      </div>
      
      <!-- Greeting -->
      <div style="padding: 32px 24px 16px 24px;">
        <p style="color: #4a4a4a; font-size: 16px; margin: 0;">
          Hi ${userName},
        </p>
        <p style="color: #6a6a6a; font-size: 14px; margin: 12px 0 0 0;">
          Here's your financial performance summary for ${companyName ? `<strong>${companyName}</strong>` : 'your business'} (${startDateStr} - ${endDateStr}):
        </p>
      </div>
      
      <!-- Metrics Cards -->
      <div style="padding: 0 24px 24px 24px;">
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
          <!-- Revenue -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e8e8;">
            <div>
              <p style="margin: 0; color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Revenue</p>
              <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">${formatCurrency(thisWeek.revenue)}</p>
            </div>
            <div style="text-align: right;">
              ${formatChange(changes.revenue)}
            </div>
          </div>
          
          <!-- Expenses -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e8e8;">
            <div>
              <p style="margin: 0; color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Expenses</p>
              <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">${formatCurrency(thisWeek.expenses)}</p>
            </div>
            <div style="text-align: right;">
              ${formatChange(changes.expenses)}
            </div>
          </div>
          
          <!-- Profit -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e8e8;">
            <div>
              <p style="margin: 0; color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Profit</p>
              <p style="margin: 4px 0 0 0; color: ${thisWeek.profit >= 0 ? '#22c55e' : '#ef4444'}; font-size: 20px; font-weight: 600;">${formatCurrency(thisWeek.profit)}</p>
            </div>
            <div style="text-align: right;">
              ${formatChange(changes.profit)}
            </div>
          </div>
          
          <!-- Cash Flow -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e8e8;">
            <div>
              <p style="margin: 0; color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Cash Flow</p>
              <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">${formatCurrency(thisWeek.cashFlow)}</p>
            </div>
            <div style="text-align: right;">
              ${formatChange(changes.cashFlow)}
            </div>
          </div>
          
          <!-- Health Score -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <p style="margin: 0; color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Health Score</p>
            </div>
            <div style="text-align: right;">
              <span style="background-color: ${healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                ${healthScore || 'N/A'}/100
              </span>
            </div>
          </div>
        </div>
      </div>
      
      ${aiInsights ? `
      <!-- AI Insights -->
      <div style="padding: 0 24px 24px 24px;">
        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">AI Insights</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${aiInsights}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- CTA -->
      <div style="padding: 0 24px 32px 24px; text-align: center;">
        <a href="https://app.vesta.ai/dashboard" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 14px;">
          View Full Dashboard
        </a>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9f9f9; padding: 24px; border-top: 1px solid #e8e8e8;">
        <p style="margin: 0; color: #8a8a8a; font-size: 12px; text-align: center;">
          You're receiving this because you have weekly reports enabled. 
          <a href="https://app.vesta.ai/settings" style="color: #6a6a6a;">Manage preferences</a>
        </p>
        <p style="margin: 12px 0 0 0; color: #a0a0a0; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Vesta. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

serve(sentryServe("generate-weekly-report", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, weekStartDate, sendEmail = true }: WeeklyReportRequest = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    console.log(`[WEEKLY REPORT] Starting generation for user ${userId}`);

    // Check if user has weekly reports enabled
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!emailSettings?.weekly_reports_enabled) {
      console.log(`[WEEKLY REPORT] User ${userId} has weekly reports disabled`);
      return new Response(JSON.stringify({
        success: false,
        message: "Weekly reports are disabled for this user"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate the report
    const report = await generateWeeklyReport(userId, weekStartDate);

    // Create in-app notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'weekly_report',
        title: report.title,
        message: report.message,
        data: report.data,
      })
      .select()
      .single();

    if (notificationError) throw notificationError;

    console.log(`[WEEKLY REPORT] In-app notification created: ${notification.id}`);

    // Send email if enabled
    if (sendEmail) {
      // Get user email from auth or profile
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      const userEmail = authUser?.email || emailSettings?.email;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      const userName = profile?.full_name || 'there';

      if (userEmail) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        
        if (resendApiKey) {
          try {
            const emailHtml = getEmailHtml(report, userName);
            
            const weeklyPayload: Record<string, unknown> = {
              from: getResendFrom(),
              to: [userEmail],
              subject: `📊 ${report.title}`,
              html: emailHtml,
            };
            const wrt = getResendReplyTo();
            if (wrt) weeklyPayload.reply_to = wrt;

            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(weeklyPayload),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('[WEEKLY REPORT] Resend API error:', errorData);
            } else {
              const result = await response.json();
              console.log(`[WEEKLY REPORT] Email sent to ${userEmail}, ID: ${result.id}`);
              
              // Mark notification as email sent
              await supabase
                .from('notifications')
                .update({ email_sent: true })
                .eq('id', notification.id);
            }
          } catch (emailError) {
            console.error('[WEEKLY REPORT] Email error:', emailError);
          }
        } else {
          console.log('[WEEKLY REPORT] RESEND_API_KEY not configured, skipping email');
        }
      }

      // Update last sent timestamp
      await supabase
        .from('email_settings')
        .update({ last_sent: new Date().toISOString() })
        .eq('user_id', userId);
    }

    return new Response(JSON.stringify({
      success: true,
      notificationId: notification.id,
      reportData: report.data,
      message: "Weekly report generated successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[WEEKLY REPORT] Error:", error);

    return new Response(JSON.stringify({
      error: "Weekly report generation failed",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
