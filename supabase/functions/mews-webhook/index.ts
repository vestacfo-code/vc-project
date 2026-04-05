// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
// verify_jwt: false  — this function is called by Mews, not authenticated users
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mews-webhook-secret',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Optional shared webhook secret configured in Mews dashboard
const WEBHOOK_SECRET = Deno.env.get('MEWS_WEBHOOK_SECRET') ?? '';

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MEWS-WEBHOOK] ${step}${suffix}`);
};

serve(sentryServe("mews-webhook", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Mews requires a fast 200 OK, so we respond quickly and process async
  // We'll process synchronously but keep it tight.

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: { Events?: any[]; ClientToken?: string };
  try {
    payload = await req.json();
  } catch {
    log('Invalid JSON body');
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Verify authenticity of the webhook call ───────────────────────────────
  // Strategy 1: shared webhook secret header
  const secretHeader = req.headers.get('x-mews-webhook-secret') ?? '';
  const bodyClientToken = payload?.ClientToken ?? '';

  const hasValidSecret = WEBHOOK_SECRET && secretHeader === WEBHOOK_SECRET;
  const hasClientToken = Boolean(bodyClientToken);

  if (!hasValidSecret && !hasClientToken) {
    log('Webhook rejected: no valid secret or client token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const events: any[] = payload?.Events ?? [];
  log(`Received ${events.length} event(s)`);

  if (events.length === 0) {
    // Nothing to process — return 200 immediately
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Look up integration by client_token ───────────────────────────────────
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let hotelId: string | null = null;

  if (bodyClientToken) {
    // Find integration whose credentials->client_token matches
    const { data: integrations, error: integErr } = await supabase
      .from('integrations')
      .select('id, hotel_id, credentials')
      .eq('provider', 'mews')
      .eq('type', 'pms')
      .eq('status', 'active');

    if (integErr) {
      log('Integration lookup error', integErr.message);
    } else if (integrations) {
      const match = integrations.find(
        (i) => (i.credentials as any)?.client_token === bodyClientToken,
      );
      if (match) {
        hotelId = match.hotel_id;
        log('Matched integration', { hotelId, integrationId: match.id });
      }
    }
  }

  if (!hotelId) {
    log('No matching integration found for client_token');
    // Still return 200 to Mews — we just cannot process it
    return new Response(JSON.stringify({ received: true, processed: false, reason: 'no matching integration' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Filter for Reservation events and trigger mews-sync for today ─────────
  const reservationEvents = events.filter((e) => e?.Type === 'Reservation');
  log(`${reservationEvents.length} Reservation event(s) found`);

  if (reservationEvents.length > 0) {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Call mews-sync internally for today's date only
    try {
      const syncUrl = `${supabaseUrl}/functions/v1/mews-sync`;
      const syncRes = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          from_date: todayStr,
          to_date: todayStr,
        }),
      });

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        log('mews-sync triggered successfully', { records_synced: syncData?.records_synced });
      } else {
        const errText = await syncRes.text();
        log('mews-sync trigger failed (non-fatal)', { status: syncRes.status, body: errText });
      }
    } catch (syncErr) {
      log('mews-sync invocation error (non-fatal)', String(syncErr));
    }
  }

  // Return 200 immediately (Mews requires fast responses)
  return new Response(
    JSON.stringify({
      received: true,
      events_count: events.length,
      reservation_events: reservationEvents.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
