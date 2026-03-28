// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-DAILY-SUMMARY] ${step}${suffix}`);
};

// ─── Anomaly detection ───────────────────────────────────────────────────────

interface AnomalyRecord {
  hotel_id: string;
  date: string;
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation_pct: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_resolved: boolean;
}

function getSeverity(absPct: number): 'low' | 'medium' | 'high' | 'critical' {
  if (absPct > 60) return 'critical';
  if (absPct > 40) return 'high';
  if (absPct > 25) return 'medium';
  return 'low';
}

function detectAnomalies(
  hotelId: string,
  targetDate: string,
  todayMetrics: Record<string, number>,
  rollingWindow: Record<string, number>[],
): AnomalyRecord[] {
  const metricsToCheck: { key: string; label: string }[] = [
    { key: 'revpar', label: 'RevPAR' },
    { key: 'adr', label: 'ADR' },
    { key: 'occupancy_rate', label: 'Occupancy Rate' },
    { key: 'labor_cost_ratio', label: 'Labor Cost Ratio' },
    { key: 'fnb_revenue', label: 'F&B Revenue' },
  ];

  const anomalies: AnomalyRecord[] = [];

  for (const { key, label } of metricsToCheck) {
    const values = rollingWindow
      .map((row) => row[key])
      .filter((v) => v !== null && v !== undefined && !isNaN(v));

    if (values.length === 0) continue;

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    if (avg === 0) continue;

    const actual = todayMetrics[key];
    if (actual === null || actual === undefined || isNaN(actual)) continue;

    const deviationPct = ((actual - avg) / avg) * 100;
    const absPct = Math.abs(deviationPct);

    if (absPct > 15) {
      const direction = deviationPct > 0 ? 'above' : 'below';
      const severity = getSeverity(absPct);
      const message = `${label} is ${absPct.toFixed(0)}% ${direction} your 7-day average (${actual.toFixed(2)} vs ${avg.toFixed(2)})`;

      anomalies.push({
        hotel_id: hotelId,
        date: targetDate,
        metric_name: key,
        expected_value: parseFloat(avg.toFixed(4)),
        actual_value: actual,
        deviation_pct: parseFloat(deviationPct.toFixed(2)),
        severity,
        message,
        is_resolved: false,
      });
    }
  }

  return anomalies;
}

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function avg(values: number[]): number {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

// ─── Fallback summary ─────────────────────────────────────────────────────────

function buildFallbackSummary(
  hotelName: string,
  currency: string,
  today: Record<string, number>,
  revparChange: number,
  occupancyChange: number,
): { headline: string; body: string; status: string; recommendation: string } {
  const statusLabel =
    today.occupancy_rate >= 0.75 && today.goppar > 0
      ? 'on_track'
      : today.occupancy_rate < 0.5 || today.goppar < 0
      ? 'critical'
      : 'attention_needed';

  const headline = `${hotelName} achieved ${(today.occupancy_rate * 100).toFixed(1)}% occupancy with RevPAR of ${currency}${today.revpar?.toFixed(2)} on ${new Date().toISOString().slice(0, 10)}.`;

  const body = `RevPAR moved ${revparChange >= 0 ? 'up' : 'down'} ${Math.abs(revparChange)}% week-over-week to ${currency}${today.revpar?.toFixed(2)}, while occupancy shifted ${occupancyChange >= 0 ? 'up' : 'down'} ${Math.abs(occupancyChange)}%. Labor cost ratio stands at ${(today.labor_cost_ratio * 100).toFixed(1)}% of revenue. (AI analysis unavailable — templated fallback.)`;

  const recommendation =
    today.labor_cost_ratio > 0.35
      ? 'Review scheduling to bring labor cost ratio below 35%.'
      : today.occupancy_rate < 0.6
      ? 'Consider promotional rates or packages to lift occupancy.'
      : 'Maintain current pricing strategy and monitor demand trends daily.';

  return { headline, body, status: statusLabel, recommendation };
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<{
  headline: string;
  body: string;
  status: string;
  recommendation: string;
  tokensUsed: number;
}> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.content[0]?.text ?? '';
  const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens ?? 0;

  // Extract JSON from Claude's response
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    headline: parsed.headline ?? '',
    body: parsed.body ?? '',
    status: parsed.status ?? 'attention_needed',
    recommendation: parsed.recommendation ?? '',
    tokensUsed,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth verification ─────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse request body ────────────────────────────────────────────────────
    let body: { hotel_id?: string; date?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hotel_id, date } = body;
    if (!hotel_id) {
      return new Response(JSON.stringify({ error: 'hotel_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetDate = date ?? new Date().toISOString().slice(0, 10);

    // ── Service-role client for DB operations ─────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Authorization: verify user is a hotel member ──────────────────────────
    const { data: membership, error: memberError } = await supabase
      .from('hotel_members')
      .select('role')
      .eq('hotel_id', hotel_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      log('Auth check failed', { hotel_id, userId: user.id, error: memberError?.message });
      return new Response(JSON.stringify({ error: 'Forbidden: not a member of this hotel' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch hotel details ───────────────────────────────────────────────────
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('id, name, room_count, city, country, currency')
      .eq('id', hotel_id)
      .single();

    if (hotelError || !hotel) {
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch last 14 days of metrics ─────────────────────────────────────────
    const since = new Date(targetDate);
    since.setDate(since.getDate() - 14);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data: metricsRows, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('hotel_id', hotel_id)
      .gte('date', sinceStr)
      .lte('date', targetDate)
      .order('date', { ascending: true });

    if (metricsError) {
      log('Metrics fetch error', metricsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!metricsRows || metricsRows.length === 0) {
      return new Response(JSON.stringify({ error: 'No metrics found for this hotel and date range' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Split rows: today vs rolling window (7 days before today, excluding today)
    const todayRow = metricsRows.find((r) => r.date === targetDate);
    if (!todayRow) {
      return new Response(JSON.stringify({ error: `No metrics found for ${targetDate}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rolling window: up to 7 days prior to targetDate (excluding today)
    const rollingWindow = metricsRows
      .filter((r) => r.date < targetDate)
      .slice(-7);

    // Week-ago row for week-over-week change
    const weekAgoDate = new Date(targetDate);
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    const weekAgoStr = weekAgoDate.toISOString().slice(0, 10);
    const weekAgoRow = metricsRows.find((r) => r.date === weekAgoStr) ?? rollingWindow[0] ?? todayRow;

    const revparChange = calcChange(todayRow.revpar, weekAgoRow.revpar);
    const adrChange = calcChange(todayRow.adr, weekAgoRow.adr);
    const occupancyChange = calcChange(todayRow.occupancy_rate, weekAgoRow.occupancy_rate);
    const gopparChange = calcChange(todayRow.goppar, weekAgoRow.goppar);

    const avgRevpar = avg(rollingWindow.map((r) => r.revpar));
    const avgOccupancy = avg(rollingWindow.map((r) => r.occupancy_rate));

    // ── Anomaly detection (Deno-side, before Claude) ──────────────────────────
    const detectedAnomalies = detectAnomalies(hotel_id, targetDate, todayRow, rollingWindow);
    log(`Detected ${detectedAnomalies.length} anomalies`);

    // ── Build Claude prompt ───────────────────────────────────────────────────
    const currency = hotel.currency ?? '$';
    const fmt = (n: number | null | undefined) =>
      n !== null && n !== undefined ? n.toFixed(2) : 'N/A';

    const prompt = `You are the AI CFO for ${hotel.name}, a ${hotel.room_count}-room hotel in ${hotel.city}.

Today's metrics (${targetDate}):
- RevPAR: ${currency}${fmt(todayRow.revpar)} (${revparChange > 0 ? '+' : ''}${revparChange}% vs last week)
- ADR: ${currency}${fmt(todayRow.adr)} (${adrChange > 0 ? '+' : ''}${adrChange}% vs last week)
- Occupancy: ${((todayRow.occupancy_rate ?? 0) * 100).toFixed(1)}% (${occupancyChange > 0 ? '+' : ''}${occupancyChange}% vs last week)
- GOPPAR: ${currency}${fmt(todayRow.goppar)} (${gopparChange > 0 ? '+' : ''}${gopparChange}% vs last week)
- Labor cost ratio: ${((todayRow.labor_cost_ratio ?? 0) * 100).toFixed(1)}% of revenue
- F&B revenue: ${currency}${fmt(todayRow.fnb_revenue)}

7-day averages for context:
- Avg RevPAR: ${currency}${avgRevpar.toFixed(2)}
- Avg Occupancy: ${(avgOccupancy * 100).toFixed(1)}%

Write a concise daily financial briefing for the hotel owner. Include:
1. A one-sentence headline summarizing today's performance
2. 2-3 sentences of analysis explaining key drivers and what needs attention
3. One specific actionable recommendation

Keep the tone professional but direct. Use specific numbers. Total response under 150 words.

Format your response as JSON:
{
  "headline": "...",
  "body": "...",
  "status": "on_track" | "attention_needed" | "critical",
  "recommendation": "..."
}`;

    // ── Call Claude (with fallback) ────────────────────────────────────────────
    let headline: string;
    let bodyText: string;
    let status: string;
    let recommendation: string;
    let tokensUsed = 0;
    let modelUsed = 'claude-sonnet-4-6';
    let usedFallback = false;

    try {
      const claudeResult = await callClaude(prompt);
      headline = claudeResult.headline;
      bodyText = claudeResult.body;
      status = claudeResult.status;
      recommendation = claudeResult.recommendation;
      tokensUsed = claudeResult.tokensUsed;
      log('Claude call succeeded', { tokensUsed });
    } catch (claudeErr) {
      log('Claude call failed, using fallback', { error: String(claudeErr) });
      const fallback = buildFallbackSummary(hotel.name, currency, todayRow, revparChange, occupancyChange);
      headline = fallback.headline;
      bodyText = fallback.body;
      status = fallback.status;
      recommendation = fallback.recommendation;
      modelUsed = 'fallback-template';
      usedFallback = true;
    }

    // ── Upsert ai_summaries ───────────────────────────────────────────────────
    const metricsSnapshot = {
      revpar: todayRow.revpar,
      adr: todayRow.adr,
      occupancy_rate: todayRow.occupancy_rate,
      goppar: todayRow.goppar,
      labor_cost_ratio: todayRow.labor_cost_ratio,
      fnb_revenue: todayRow.fnb_revenue,
      revpar_change: revparChange,
      adr_change: adrChange,
      occupancy_change: occupancyChange,
      goppar_change: gopparChange,
      avg_revpar: avgRevpar,
      avg_occupancy: avgOccupancy,
      anomalies_count: detectedAnomalies.length,
      recommendation,
    };

    const { data: savedSummary, error: upsertError } = await supabase
      .from('ai_summaries')
      .upsert(
        {
          hotel_id,
          date: targetDate,
          period_type: 'daily',
          headline,
          body: bodyText,
          status,
          metrics_snapshot: metricsSnapshot,
          model: modelUsed,
          tokens_used: tokensUsed,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'hotel_id,date,period_type' },
      )
      .select()
      .single();

    if (upsertError) {
      log('ai_summaries upsert error', upsertError.message);
      // Non-fatal — continue to write anomalies and return the result
    }

    // ── Insert anomalies ──────────────────────────────────────────────────────
    if (detectedAnomalies.length > 0) {
      const { error: anomalyError } = await supabase
        .from('anomalies')
        .upsert(detectedAnomalies, { onConflict: 'hotel_id,date,metric_name' });

      if (anomalyError) {
        log('anomalies upsert error', anomalyError.message);
      } else {
        log(`Wrote ${detectedAnomalies.length} anomalies`);
      }
    }

    // ── Return result ─────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          hotel_id,
          date: targetDate,
          period_type: 'daily',
          headline,
          body: bodyText,
          status,
          recommendation,
          model: modelUsed,
          tokens_used: tokensUsed,
          used_fallback: usedFallback,
          generated_at: savedSummary?.generated_at ?? new Date().toISOString(),
        },
        anomalies: detectedAnomalies,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log('Unhandled error', String(err));
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
