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
  console.log(`[MEWS-SYNC] ${step}${suffix}`);
};

function isoDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Returns all calendar dates between fromDate and toDate (inclusive), YYYY-MM-DD strings.
function dateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  const cur = new Date(fromDate + 'T00:00:00Z');
  const end = new Date(toDate + 'T00:00:00Z');
  while (cur <= end) {
    dates.push(isoDateStr(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// Aggregate Mews reservations into a per-day map.
// Returns Map<dateStr, { rooms_sold, total_revenue }>
function aggregateReservations(
  reservations: any[],
): Map<string, { rooms_sold: number; total_revenue: number }> {
  const agg = new Map<string, { rooms_sold: number; total_revenue: number }>();

  for (const r of reservations) {
    // Use ScheduledStartUtc for the stay date; fall back to StartUtc
    const rawDate: string = r.ScheduledStartUtc ?? r.StartUtc ?? '';
    if (!rawDate) continue;

    const dateStr = rawDate.slice(0, 10);
    const amount = Number(r.TotalAmount?.Value ?? r.TotalCost?.Value ?? 0);

    if (!agg.has(dateStr)) {
      agg.set(dateStr, { rooms_sold: 0, total_revenue: 0 });
    }
    const entry = agg.get(dateStr)!;
    entry.rooms_sold += 1;
    entry.total_revenue += amount;
  }

  return agg;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth: accept user JWT or service-role key ─────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine if the caller is presenting the service-role key directly or a user JWT
  const rawToken = authHeader.replace(/^Bearer\s+/i, '');
  let userId: string | null = null;

  if (rawToken !== supabaseServiceKey) {
    // Treat as user JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(rawToken);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;
  }
  // If rawToken === supabaseServiceKey it's a cron/internal call; skip user check.

  // ── Parse request body ────────────────────────────────────────────────────
  let body: { hotel_id?: string; from_date?: string; to_date?: string };
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

  // If user JWT, verify membership
  if (userId) {
    const { data: membership, error: memberError } = await supabase
      .from('hotel_members')
      .select('role')
      .eq('hotel_id', hotel_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError || !membership) {
      log('Membership not found', { hotel_id, userId });
      return new Response(JSON.stringify({ error: 'Forbidden: not a member of this hotel' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Compute default date range: 30 days ago → yesterday
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const fromDate = body.from_date ?? isoDateStr(thirtyDaysAgo);
  const toDate = body.to_date ?? isoDateStr(yesterday);

  log('Starting sync', { hotel_id, fromDate, toDate });

  // ── Fetch integration credentials ─────────────────────────────────────────
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id, credentials, status')
    .eq('hotel_id', hotel_id)
    .eq('provider', 'mews')
    .eq('type', 'pms')
    .maybeSingle();

  if (integrationError || !integration) {
    log('No Mews integration found', { hotel_id });
    return new Response(
      JSON.stringify({ error: 'No active Mews integration found for this hotel' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { access_token, client_token, platform_url } = integration.credentials as {
    access_token: string;
    client_token: string;
    platform_url: string;
  };

  // ── Fetch hotel room count ────────────────────────────────────────────────
  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .select('room_count')
    .eq('id', hotel_id)
    .single();

  if (hotelError || !hotel) {
    log('Hotel not found', { hotel_id });
    return new Response(JSON.stringify({ error: 'Hotel not found' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const roomCount: number = hotel.room_count;

  // ── Create sync_log entry with status 'running' ───────────────────────────
  const { data: syncLog, error: syncLogCreateError } = await supabase
    .from('sync_logs')
    .insert({
      integration_id: integration.id,
      hotel_id,
      status: 'running',
      records_synced: 0,
      metadata: { from_date: fromDate, to_date: toDate },
    })
    .select('id')
    .single();

  if (syncLogCreateError || !syncLog) {
    log('sync_log create error', syncLogCreateError?.message);
    // Non-fatal — continue without a sync log id
  }

  const syncLogId: string | null = syncLog?.id ?? null;

  const failSync = async (errMsg: string) => {
    log('Sync failed', errMsg);
    if (syncLogId) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: errMsg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);
    }
    // Also mark integration as error
    await supabase
      .from('integrations')
      .update({ status: 'error', error_message: errMsg, updated_at: new Date().toISOString() })
      .eq('id', integration.id);
  };

  try {
    // ── Call Mews reservations API ────────────────────────────────────────────
    log('Calling Mews reservations API');
    const mewsRes = await fetch(`${platform_url}/api/connector/v1/reservations/getAll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: client_token,
        AccessToken: access_token,
        Client: 'Vesta v1.0',
        StartUtc: `${fromDate}T00:00:00Z`,
        EndUtc: `${toDate}T23:59:59Z`,
        States: ['Checked'],
        Extent: { Reservations: true, Revenue: true },
      }),
    });

    if (!mewsRes.ok) {
      const errText = await mewsRes.text();
      await failSync(`Mews API error ${mewsRes.status}: ${errText}`);
      return new Response(
        JSON.stringify({ error: 'Mews API request failed', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const mewsData = await mewsRes.json();
    const reservations: any[] = mewsData?.Reservations ?? mewsData?.reservations ?? [];
    log(`Fetched ${reservations.length} reservations from Mews`);

    // ── Aggregate to daily totals ─────────────────────────────────────────────
    const dailyAgg = aggregateReservations(reservations);
    const allDates = dateRange(fromDate, toDate);
    let recordsSynced = 0;

    // ── Upsert daily_metrics for each date in range ───────────────────────────
    for (const dateStr of allDates) {
      const agg = dailyAgg.get(dateStr) ?? { rooms_sold: 0, total_revenue: 0 };
      const { rooms_sold, total_revenue } = agg;
      const adr = rooms_sold > 0 ? total_revenue / rooms_sold : 0;
      const revpar = roomCount > 0 ? total_revenue / roomCount : 0;

      const { error: upsertError } = await supabase.from('daily_metrics').upsert(
        {
          hotel_id,
          date: dateStr,
          rooms_available: roomCount,
          rooms_sold,
          rooms_out_of_order: 0,
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
          total_revenue: Math.round(total_revenue * 100) / 100,
          room_revenue: Math.round(total_revenue * 100) / 100,
          data_source: 'pms_sync',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hotel_id,date', ignoreDuplicates: false },
      );

      if (upsertError) {
        log(`daily_metrics upsert error for ${dateStr}`, upsertError.message);
      } else {
        recordsSynced++;
      }
    }

    log(`Upserted ${recordsSynced} daily_metric rows`);

    // ── Update sync_log and integration last_sync_at ──────────────────────────
    if (syncLogId) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'success',
          records_synced: recordsSynced,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);
    }

    await supabase
      .from('integrations')
      .update({
        status: 'active',
        error_message: null,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: recordsSynced,
        from_date: fromDate,
        to_date: toDate,
        sync_log_id: syncLogId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const errMsg = String(err);
    await failSync(errMsg);
    log('Unhandled error', errMsg);
    return new Response(JSON.stringify({ error: 'Internal server error', details: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
