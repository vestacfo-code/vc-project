// @ts-nocheck
import { quickBooksApiEnvironmentFromSecrets } from "../_shared/quickbooks-api-base.ts";
import { resolveQuickBooksOAuthScope } from "../_shared/quickbooks-oauth-scope.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/** Secrets pasted into the dashboard sometimes include leading TAB/LF — Intuit matches redirect_uri exactly; %09 breaks OAuth. */
function envTrim(key: string): string | undefined {
  const v = Deno.env.get(key);
  if (v == null) return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const QB_CLIENT_ID = envTrim('QUICKBOOKS_CLIENT_ID') ?? '';
const QB_CLIENT_SECRET = envTrim('QUICKBOOKS_CLIENT_SECRET') ?? '';
const siteBase = (envTrim('SITE_URL') ?? envTrim('PUBLIC_SITE_URL') ?? 'https://vesta.ai').replace(
  /\/$/,
  '',
);
/** Dedicated path so browser Supabase client never treats Intuit's ?code= as PKCE on /integrations. */
const QB_REDIRECT_URI = envTrim('QUICKBOOKS_REDIRECT_URI') ?? `${siteBase}/integrations/qb-callback`;

/** Space-delimited scopes for https://appcenter.intuit.com/connect/oauth2 — see _shared/quickbooks-oauth-scope.ts */
const QB_OAUTH_SCOPE = resolveQuickBooksOAuthScope();

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[QB-HOTEL-OAUTH] ${step}${suffix}`);
};

serve(sentryServe("quickbooks-hotel-oauth", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ── Auth: verify user via anon client ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    const user = userData?.user;
    if (authError || !user) {
      log('Auth failed', { message: authError?.message });
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: { action?: string; hotel_id?: string; code?: string; realm_id?: string; state?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, hotel_id } = body;

    if (!action || !hotel_id) {
      return new Response(JSON.stringify({ error: 'action and hotel_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Service-role client for DB operations ──────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Shared hotel membership check (used by authorize + disconnect) ─────────
    const verifyMembership = async (): Promise<Response | null> => {
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
      return null;
    };

    // ══════════════════════════════════════════════════════════════════════════
    // action = "authorize"
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'authorize') {
      const forbidden = await verifyMembership();
      if (forbidden) return forbidden;

      if (!QB_CLIENT_ID) {
        return new Response(JSON.stringify({ error: 'QuickBooks client ID not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate state: hotel_id + ':' + random UUID
      const state = `${hotel_id}:${crypto.randomUUID()}`;

      const params = new URLSearchParams({
        client_id: QB_CLIENT_ID,
        response_type: 'code',
        scope: QB_OAUTH_SCOPE,
        redirect_uri: QB_REDIRECT_URI,
        state,
      });

      const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;

      log('Generated auth URL', { hotel_id, state, scope: QB_OAUTH_SCOPE });

      return new Response(JSON.stringify({ authUrl, state, oauth_scope: QB_OAUTH_SCOPE }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // action = "callback"
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'callback') {
      const { code, realm_id, state } = body;

      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'code and state are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate state starts with hotel_id
      if (!state.startsWith(`${hotel_id}:`)) {
        log('State mismatch', { expected_prefix: `${hotel_id}:`, state });
        return new Response(JSON.stringify({ error: 'Invalid OAuth state — hotel_id mismatch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const forbiddenCallback = await verifyMembership();
      if (forbiddenCallback) return forbiddenCallback;

      if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
        return new Response(JSON.stringify({ error: 'QuickBooks credentials not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const realmFromBody =
        typeof realm_id === 'string' && realm_id.trim().length > 0 ? realm_id.trim() : '';

      // Exchange code for tokens
      log('Exchanging code for tokens', { hotel_id, realm_from_body: realmFromBody || '(none)' });
      const tokenResponse = await fetch(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: QB_REDIRECT_URI,
          }),
        },
      );

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok || tokens.error) {
        log('Token exchange failed', { status: tokenResponse.status, error: tokens.error });
        return new Response(
          JSON.stringify({ error: 'Token exchange failed', details: tokens.error_description ?? tokens.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const realmFromToken =
        (typeof tokens.realmId === 'string' && tokens.realmId.trim()) ||
        (typeof tokens.realm_id === 'string' && tokens.realm_id.trim()) ||
        '';
      const effectiveRealmId = realmFromBody || realmFromToken;

      if (!effectiveRealmId) {
        log('Missing realmId after token exchange', { hotel_id, keys: Object.keys(tokens) });
        return new Response(
          JSON.stringify({
            error: 'Missing QuickBooks company ID (realmId)',
            details:
              'Intuit did not send realmId on the redirect URL and it was not in the token response. Check the Redirect URI in the Intuit Developer app matches this site exactly (including https and path /integrations/qb-callback), and that the app uses the QuickBooks Accounting scope.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      const api_environment = quickBooksApiEnvironmentFromSecrets();

      // Upsert integration record
      const { error: upsertError } = await supabase
        .from('integrations')
        .upsert(
          {
            hotel_id,
            type: 'accounting',
            provider: 'quickbooks',
            credentials: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              realm_id: effectiveRealmId,
              expires_at: expiresAt,
              api_environment,
            },
            status: 'active',
            error_message: null,
            last_sync_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'hotel_id,provider', ignoreDuplicates: false },
        );

      if (upsertError) {
        log('Integration upsert error', upsertError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to save integration', details: upsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      log('Integration saved', { hotel_id, realm_id: effectiveRealmId });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // action = "disconnect"
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'disconnect') {
      const forbidden = await verifyMembership();
      if (forbidden) return forbidden;

      const { error: deleteError } = await supabase
        .from('integrations')
        .delete()
        .eq('hotel_id', hotel_id)
        .eq('provider', 'quickbooks');

      if (deleteError) {
        log('Delete error', deleteError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect integration', details: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      log('Integration disconnected', { hotel_id });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unknown action
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    log('Unhandled error', String(err));
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
}));
