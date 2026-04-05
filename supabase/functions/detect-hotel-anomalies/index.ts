// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { getResendFrom, getResendReplyTo } from "../_shared/resend.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DETECT-HOTEL-ANOMALIES] ${step}${suffix}`);
};

type MetricKey = 'revpar' | 'adr' | 'occupancy_rate' | 'goppar';
type Severity = 'low' | 'medium' | 'high' | 'critical';

interface AnomalyRecord {
  hotel_id: string;
  date: string;
  metric: MetricKey;
  severity: Severity;
  title: string;
  description: string;
  current_value: number;
  expected_min: number;
  expected_max: number;
  acknowledged: boolean;
  resolved: boolean;
  detected_at: string;
}

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

function detectAnomalies(
  hotelId: string,
  targetDate: string,
  todayRow: Record<string, any>,
  rollingWindow: Record<string, any>[],
): AnomalyRecord[] {
  const metrics: MetricKey[] = ['revpar', 'adr', 'occupancy_rate', 'goppar'];
  const anomalies: AnomalyRecord[] = [];
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

    const title = `${label} ${direction} ${absPct.toFixed(0)}% vs recent average`;
    const description = `${label} was ${formatMetricValue(currentVal, metric)}, expected between ${formatMetricValue(expectedMin, metric)}–${formatMetricValue(expectedMax, metric)} based on last 14 days (avg: ${formatMetricValue(avg, metric)}, ${absPct.toFixed(0)}% ${directionWord} normal range)`;

    anomalies.push({
      hotel_id: hotelId,
      date: targetDate,
      metric,
      severity,
      title,
      description,
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
    // ── Auth verification ────────────────────────────────────────────────────
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

    // ── Parse request body ───────────────────────────────────────────────────
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

    // ── Service-role client (bypasses RLS) ───────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Authorization: verify user is a hotel member ─────────────────────────
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

    // ── Fetch last 30 days of daily_metrics ─────────────────────────────────
    const since = new Date(targetDate);
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data: metricsRows, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('date, revpar, adr, occupancy_rate, goppar')
      .eq('hotel_id', hotel_id)
      .gte('date', sinceStr)
      .lte('date', targetDate)
      .order('date', { ascending: false });

    if (metricsError) {
      log('Metrics fetch error', metricsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!metricsRows || metricsRows.length === 0) {
      return new Response(JSON.stringify({ error: 'No metrics found for this hotel in the last 30 days' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Most recent day with data is the target (rows are ordered desc)
    const mostRecentRow = metricsRows[0];
    const checkedDate = mostRecentRow.date;

    // Rolling window: up to 14 days prior to the most recent day (excluding it)
    const rollingWindow = metricsRows
      .filter((r) => r.date < checkedDate)
      .slice(0, 14);

    log(`Using ${rollingWindow.length} days for rolling window`, { checkedDate });

    if (rollingWindow.length === 0) {
      return new Response(
        JSON.stringify({ success: true, anomalies_detected: 0, anomalies: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Detect anomalies ─────────────────────────────────────────────────────
    const detectedAnomalies = detectAnomalies(hotel_id, checkedDate, mostRecentRow, rollingWindow);
    log(`Detected ${detectedAnomalies.length} anomalies`);

    // ── Upsert anomalies to DB ───────────────────────────────────────────────
    if (detectedAnomalies.length > 0) {
      const { error: upsertError } = await supabase
        .from('anomalies')
        .upsert(detectedAnomalies, {
          onConflict: 'hotel_id,date,metric',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        log('anomalies upsert error', upsertError.message);
        // Non-fatal — return what we found even if we couldn't save
      } else {
        log(`Saved ${detectedAnomalies.length} anomalies`);
      }
    }

    // ── Create notifications for critical/high anomalies ─────────────────────
    const notifiableAnomalies = detectedAnomalies.filter(
      (a) => a.severity === 'critical' || a.severity === 'high',
    );

    if (notifiableAnomalies.length > 0) {
      try {
        // Fetch members with their profile emails
        const { data: members } = await supabase
          .from('hotel_members')
          .select('user_id')
          .eq('hotel_id', hotel_id);

        const { data: hotel } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', hotel_id)
          .single();

        if (members && members.length > 0) {
          // Get emails from profiles
          const userIds = members.map((m) => m.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .in('user_id', userIds);

          const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

          const notifications = [];
          for (const anomaly of notifiableAnomalies) {
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

          // In-app notifications
          const { error: notifError } = await supabase
            .from('hotel_notifications')
            .insert(notifications);

          if (notifError) {
            log('Notification insert error (non-fatal)', notifError.message);
          } else {
            log(`Sent ${notifications.length} anomaly notifications`);
          }

          // Email alerts for critical anomalies only (avoid spam for 'high')
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          const criticalAnomalies = notifiableAnomalies.filter((a) => a.severity === 'critical');
          if (resendApiKey && criticalAnomalies.length > 0 && hotel) {
            const emailSubject = `🚨 Critical Alert — ${hotel.name}`;
            const emailBody = criticalAnomalies
              .map((a) => `<b>${a.title}</b><br>${a.description}`)
              .join('<br><br>');

            for (const member of members) {
              const profile = profileMap.get(member.user_id);
              if (!profile?.email) continue;

              const alertPayload: Record<string, unknown> = {
                from: getResendFrom(),
                to: [profile.email],
                subject: emailSubject,
                html: `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                      <div style="background:#1B3A5C;padding:20px;border-radius:8px 8px 0 0;">
                        <h2 style="color:#fff;margin:0;">🚨 Critical Alert</h2>
                        <p style="color:#C8963E;margin:4px 0 0 0;">${hotel.name}</p>
                      </div>
                      <div style="background:#fff;border:1px solid #e0e0e0;padding:24px;border-radius:0 0 8px 8px;">
                        <p style="color:#333;">Hi ${profile.full_name ?? 'there'},</p>
                        <p style="color:#333;">Vesta detected the following critical issues that need your attention:</p>
                        <div style="background:#fff5f5;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0;">
                          ${emailBody}
                        </div>
                        <a href="https://app.vesta.ai/app/alerts" style="display:inline-block;background:#1B3A5C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                          View Alerts Dashboard →
                        </a>
                        <p style="color:#888;font-size:12px;margin-top:24px;">
                          You're receiving this because you're a member of ${hotel.name} on Vesta.
                          Manage preferences in Settings → Notifications.
                        </p>
                      </div>
                    </div>
                  `,
              };
              const art = getResendReplyTo();
              if (art) alertPayload.reply_to = art;

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(alertPayload),
              }).catch((e) => log('Email send error (non-fatal)', String(e)));
            }
            log(`Sent critical alert emails to ${members.length} members`);
          }
        }
      } catch (notifErr) {
        log('Notification step error (non-fatal)', String(notifErr));
      }
    }

    // ── Return result ────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        anomalies_detected: detectedAnomalies.length,
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
