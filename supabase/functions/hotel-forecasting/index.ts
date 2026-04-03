// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HOTEL-FORECASTING] ${step}${suffix}`);
};

// Simple ordinary-least-squares linear regression.
// Returns { slope: m, intercept: b } for y = mx + b
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

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
    let body: { hotel_id?: string; horizon_days?: number };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hotel_id } = body;
    if (!hotel_id) {
      return new Response(JSON.stringify({ error: 'hotel_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const horizonDays: 30 | 60 | 90 = [30, 60, 90].includes(body.horizon_days ?? 90)
      ? (body.horizon_days ?? 90) as 30 | 60 | 90
      : 90;

    // ── Service-role client (bypasses RLS) ────────────────────────────────────
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
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch last 90 days of daily_metrics ───────────────────────────────────
    const today = new Date();
    const since = new Date(today);
    since.setUTCDate(since.getUTCDate() - 90);
    const sinceStr = since.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const { data: metricsRows, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('date, revpar, adr, occupancy_rate, total_revenue')
      .eq('hotel_id', hotel_id)
      .gte('date', sinceStr)
      .lte('date', todayStr)
      .order('date', { ascending: true });

    if (metricsError) {
      log('Metrics fetch error', metricsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!metricsRows || metricsRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No historical metrics found for this hotel in the last 90 days' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const N = metricsRows.length;
    log(`Running forecast on ${N} historical days`, { hotel_id, horizonDays });

    // Determine confidence level based on historical days available
    const confidence: 'high' | 'medium' | 'low' =
      N > 60 ? 'high' : N >= 30 ? 'medium' : 'low';

    // ── Extract metric series ─────────────────────────────────────────────────
    const revparSeries = metricsRows.map((r) => Number(r.revpar ?? 0));
    const occupancySeries = metricsRows.map((r) => Number(r.occupancy_rate ?? 0));
    const revenueSeries = metricsRows.map((r) => Number(r.total_revenue ?? 0));

    // ── Compute linear regression for each metric ─────────────────────────────
    const revparReg = linearRegression(revparSeries);
    const occupancyReg = linearRegression(occupancySeries);
    const revenueReg = linearRegression(revenueSeries);

    // ── Build projections ─────────────────────────────────────────────────────
    const lastDate = metricsRows[metricsRows.length - 1].date as string;
    const projections = [];

    for (let i = 1; i <= horizonDays; i++) {
      const x = N - 1 + i; // continues from last historical index
      const projDate = addDays(lastDate, i);

      const rawRevpar = revparReg.slope * x + revparReg.intercept;
      const rawOccupancy = occupancyReg.slope * x + occupancyReg.intercept;
      const rawRevenue = revenueReg.slope * x + revenueReg.intercept;

      projections.push({
        date: projDate,
        revpar: Math.max(0, Math.round(rawRevpar * 100) / 100),
        occupancy_rate: Math.min(1.0, Math.max(0, Math.round(rawOccupancy * 10000) / 10000)),
        total_revenue: Math.max(0, Math.round(rawRevenue * 100) / 100),
        confidence,
      });
    }

    // ── Build historical response payload ─────────────────────────────────────
    const historical = metricsRows.map((r) => ({
      date: r.date,
      revpar: Number(r.revpar ?? 0),
      occupancy_rate: Number(r.occupancy_rate ?? 0),
      total_revenue: Number(r.total_revenue ?? 0),
    }));

    // ── Persist forecast snapshot to forecasts table ──────────────────────────
    try {
      const { error: forecastInsertError } = await supabase
        .from('forecasts')
        .upsert({
          hotel_id,
          generated_at: new Date().toISOString(),
          horizon_days: horizonDays,
          historical_days: N,
          trend_revpar_slope: revparReg.slope,
          trend_occupancy_slope: occupancyReg.slope,
          trend_revenue_slope: revenueReg.slope,
          projections,
        }, { onConflict: 'hotel_id,generated_at', ignoreDuplicates: false });

      if (forecastInsertError) {
        log('Forecast upsert error (non-fatal)', forecastInsertError.message);
      }
    } catch (persistErr) {
      log('Forecast persist step error (non-fatal)', String(persistErr));
    }

    return new Response(
      JSON.stringify({
        historical,
        projections,
        trend: {
          revpar_slope: Math.round(revparReg.slope * 10000) / 10000,
          occupancy_slope: Math.round(occupancyReg.slope * 1000000) / 1000000,
          revenue_slope: Math.round(revenueReg.slope * 100) / 100,
        },
        horizon_days: horizonDays,
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
