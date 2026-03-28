// @ts-nocheck
/**
 * detect-hotel-anomalies-internal
 *
 * Same logic as detect-hotel-anomalies but authenticated via service-role key
 * instead of a user JWT. Called by pg_cron scheduled jobs.
 *
 * Security: only accepts requests where Authorization = Bearer <SERVICE_ROLE_KEY>
 */
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
  console.log(`[DETECT-ANOMALIES-INTERNAL] ${step}${suffix}`);
};

type MetricKey = 'revpar' | 'adr' | 'occupancy_rate' | 'goppar';
type Severity = 'low' | 'medium' | 'high' | 'critical';

const METRIC_LABELS: Record<MetricKey, string> = {
  revpar: 'RevPAR',
  adr: 'ADR',
  occupancy_rate: 'Occupancy Rate',
  goppar: 'GOPPAR',
};

function getSeverity(absPct: number): Severity {
  if (absPct > 60) return 'critical';
  if (absPct > 40) return 'high';
  if (absPct > 30) return 'medium';
  return 'low';
}

function formatMetricValue(value: number, metric: MetricKey): string {
  if (metric === 'occupancy_rate') return `${(value * 100).toFixed(1)}%`;
  return `$${value.toFixed(2)}`;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function detectAnomalies(hotelId: string, targetDate: string, todayRow: any, rollingWindow: any[]) {
  const metrics: MetricKey[] = ['revpar', 'adr', 'occupancy_rate', 'goppar'];
  const anomalies = [];
  const now = new Date().toISOString();

  for (const metric of metrics) {
    const windowValues = rollingWindow
      .map((row) => row[metric])
      .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number);

    if (windowValues.length === 0) continue;
    const avg = mean(windowValues);
    if (avg === 0) continue;

    const current = todayRow[metric];
    if (current === null || current === undefined || isNaN(Number(current))) continue;

    const currentVal = Number(current);
    const deviationPct = ((currentVal - avg) / avg) * 100;
    const absPct = Math.abs(deviationPct);
    if (absPct <= 20) continue;

    const severity = getSeverity(absPct);
    const label = METRIC_LABELS[metric];
    const direction = deviationPct > 0 ? 'surged' : 'dropped';
    const directionWord = deviationPct > 0 ? 'above' : 'below';
    const expectedMin = avg * 0.8;
    const expectedMax = avg * 1.2;

    anomalies.push({
      hotel_id: hotelId,
      date: targetDate,
      metric,
      severity,
      title: `${label} ${direction} ${absPct.toFixed(0)}% vs recent average`,
      description: `${label} was ${formatMetricValue(currentVal, metric)}, expected ${formatMetricValue(expectedMin, metric)}–${formatMetricValue(expectedMax, metric)} (avg ${formatMetricValue(avg, metric)}, ${absPct.toFixed(0)}% ${directionWord} normal)`,
      current_value: currentVal,
      expected_min: expectedMin,
      expected_max: expectedMax,
      acknowledged: false,
      resolved: false,
      detected_at: now,
    });
  }
  return anomalies;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Service-role auth check ─────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch 30 days of metrics
    const since = new Date(targetDate);
    since.setDate(since.getDate() - 30);

    const { data: metricsRows, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('date, revpar, adr, occupancy_rate, goppar')
      .eq('hotel_id', hotel_id)
      .gte('date', since.toISOString().slice(0, 10))
      .lte('date', targetDate)
      .order('date', { ascending: false });

    if (metricsError || !metricsRows || metricsRows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, anomalies_detected: 0, anomalies: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const mostRecentRow = metricsRows[0];
    const checkedDate = mostRecentRow.date;
    const rollingWindow = metricsRows.filter((r) => r.date < checkedDate).slice(0, 14);

    if (rollingWindow.length === 0) {
      return new Response(
        JSON.stringify({ success: true, anomalies_detected: 0, anomalies: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const detectedAnomalies = detectAnomalies(hotel_id, checkedDate, mostRecentRow, rollingWindow);
    log(`Detected ${detectedAnomalies.length} anomalies for hotel ${hotel_id}`);

    if (detectedAnomalies.length > 0) {
      // Upsert anomalies
      await supabase.from('anomalies').upsert(detectedAnomalies, {
        onConflict: 'hotel_id,date,metric',
        ignoreDuplicates: false,
      });

      // Notify members of critical/high anomalies
      const notifiable = detectedAnomalies.filter((a) => a.severity === 'critical' || a.severity === 'high');
      if (notifiable.length > 0) {
        const { data: members } = await supabase
          .from('hotel_members')
          .select('user_id')
          .eq('hotel_id', hotel_id);

        if (members && members.length > 0) {
          const notifications = [];
          for (const anomaly of notifiable) {
            const icon = anomaly.severity === 'critical' ? '🚨' : '⚠️';
            for (const member of members) {
              notifications.push({
                hotel_id,
                user_id: member.user_id,
                type: 'anomaly',
                title: `${icon} ${anomaly.title}`,
                body: anomaly.description,
                link: `/app/alerts`,
              });
            }
          }
          await supabase.from('hotel_notifications').insert(notifications);
          log(`Sent ${notifications.length} anomaly notifications`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, anomalies_detected: detectedAnomalies.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log('Unhandled error', String(err));
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
