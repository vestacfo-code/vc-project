// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
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
  console.log(`[MEWS-CONNECT] ${step}${suffix}`);
};

serve(sentryServe("mews-connect", async (req) => {
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
    let body: {
      hotel_id?: string;
      access_token?: string;
      client_token?: string;
      platform_url?: string;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hotel_id, access_token, client_token } = body;
    if (!hotel_id || !access_token || !client_token) {
      return new Response(
        JSON.stringify({ error: 'hotel_id, access_token, and client_token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const platform_url = body.platform_url?.replace(/\/$/, '') ?? 'https://api.mews.com';

    // ── Service-role client ───────────────────────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Authorization: verify user is owner or manager of this hotel ──────────
    const { data: membership, error: memberError } = await supabase
      .from('hotel_members')
      .select('role')
      .eq('hotel_id', hotel_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      log('Membership not found', { hotel_id, userId: user.id });
      return new Response(JSON.stringify({ error: 'Forbidden: not a member of this hotel' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['owner', 'manager'].includes(membership.role)) {
      log('Insufficient role', { role: membership.role });
      return new Response(
        JSON.stringify({ error: 'Forbidden: owner or manager role required to connect integrations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Test connection by calling Mews configuration endpoint ────────────────
    log('Testing Mews connection', { platform_url });
    let mewsHotelName = '';
    try {
      const configResponse = await fetch(`${platform_url}/api/connector/v1/configuration/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientToken: client_token,
          AccessToken: access_token,
          Client: 'Vesta v1.0',
        }),
      });

      if (!configResponse.ok) {
        const errText = await configResponse.text();
        log('Mews connection test failed', { status: configResponse.status, body: errText });
        return new Response(
          JSON.stringify({
            error: 'Mews connection test failed',
            details: `HTTP ${configResponse.status}: ${errText}`,
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const configData = await configResponse.json();
      mewsHotelName =
        configData?.Enterprise?.Name ??
        configData?.Hotel?.Name ??
        configData?.Name ??
        '';
      log('Mews connection test passed', { hotelName: mewsHotelName });
    } catch (connErr) {
      log('Mews connection test threw', String(connErr));
      return new Response(
        JSON.stringify({ error: 'Failed to reach Mews API', details: String(connErr) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Upsert integration record ─────────────────────────────────────────────
    const { data: integration, error: upsertError } = await supabase
      .from('integrations')
      .upsert(
        {
          hotel_id,
          type: 'pms',
          provider: 'mews',
          credentials: { access_token, client_token, platform_url },
          status: 'active',
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hotel_id,provider', ignoreDuplicates: false },
      )
      .select('id')
      .single();

    if (upsertError || !integration) {
      log('Integration upsert error', upsertError?.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save integration', details: upsertError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    log('Integration saved', { integrationId: integration.id });

    // ── Write initial sync_log entry ──────────────────────────────────────────
    const { error: syncLogError } = await supabase.from('sync_logs').insert({
      integration_id: integration.id,
      hotel_id,
      status: 'success',
      records_synced: 0,
      metadata: { action: 'connect', mews_hotel_name: mewsHotelName },
      completed_at: new Date().toISOString(),
    });

    if (syncLogError) {
      log('sync_log insert error (non-fatal)', syncLogError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        integration_id: integration.id,
        hotel_name_from_mews: mewsHotelName,
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
}));
