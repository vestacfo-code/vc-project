// @ts-nocheck
import { resolveQuickBooksAccountingApiBase } from "../_shared/quickbooks-api-base.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Match quickbooks-hotel-oauth: trim secrets so redirect_uri / Basic auth match Intuit. */
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

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[QB-HOTEL-SYNC] ${step}${suffix}`);
};

/** Maps QuickBooks account names to public.expenses.category CHECK values. */
function mapQbAccountToExpenseCategory(accountName: string | undefined): string {
  const raw = (accountName ?? "").trim();
  const n = raw.toLowerCase();
  if (!n) return "other";

  if (/payroll|wage|salar|labor|staff|employee/.test(n)) return "labor";
  if (/utilit|electric|gas|water|sewer/.test(n)) return "utilities";
  if (/food|beverage|restaurant|bar|kitchen|f&b/.test(n)) return "food_beverage";
  if (/repair|maintenance|engineer|facility|hvac|plumb/.test(n)) return "maintenance";
  if (/market|advertis|ad spend|social media|seo|promotion/.test(n)) return "marketing";
  if (/insur/.test(n)) return "insurance";
  if (/property\s*tax|real estate tax/.test(n)) return "property_tax";
  if (/supply|supplies|amenit/.test(n)) return "supplies";
  if (/software|technology|\bit\b|saas|computer|telecom/.test(n)) return "technology";
  if (/commission|ota|booking|expedia|distribution|travel agent/.test(n)) return "distribution";
  if (/management fee|mgmt/.test(n)) return "management_fee";

  return "other";
}

const EXPENSE_WRITABLE_KEYS = new Set([
  'hotel_id',
  'date',
  'category',
  'subcategory',
  'amount',
  'description',
  'vendor',
  'source',
  'external_id',
]);

serve(sentryServe("quickbooks-hotel-sync", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: { hotel_id?: string };
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

    // ── Service-role client for DB operations ──────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Verify hotel membership ────────────────────────────────────────────────
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

    // ── Fetch active QuickBooks integration ────────────────────────────────────
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('hotel_id', hotel_id)
      .eq('provider', 'quickbooks')
      .eq('status', 'active')
      .maybeSingle();

    if (integrationError || !integration) {
      log('No active QuickBooks integration', { hotel_id });
      return new Response(
        JSON.stringify({ error: 'No active QuickBooks integration found for this hotel' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Extract credentials ────────────────────────────────────────────────────
    const creds = integration.credentials as {
      access_token: string;
      refresh_token: string;
      realm_id: string;
      expires_at: string;
      api_environment?: 'sandbox' | 'production' | string;
    };

    let { access_token, refresh_token, realm_id, expires_at } = creds;

    // ── Refresh token if expiring within 5 minutes ─────────────────────────────
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const tokenExpiry = new Date(expires_at);

    if (fiveMinFromNow >= tokenExpiry) {
      log('Token expiring soon, refreshing', { expires_at });

      const refreshResponse = await fetch(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token,
          }),
        },
      );

      const refreshTokens = await refreshResponse.json();

      if (!refreshResponse.ok || refreshTokens.error) {
        log('Token refresh failed', { status: refreshResponse.status, error: refreshTokens.error });

        await supabase
          .from('integrations')
          .update({
            status: 'error',
            error_message: 'Token expired — reconnect QuickBooks',
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        return new Response(
          JSON.stringify({
            error: 'Token expired — reconnect QuickBooks',
            details: refreshTokens.error_description ?? refreshTokens.error,
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      access_token = refreshTokens.access_token;
      refresh_token = refreshTokens.refresh_token ?? refresh_token;
      expires_at = new Date(Date.now() + refreshTokens.expires_in * 1000).toISOString();

      const prevCreds = (integration.credentials as Record<string, unknown>) ?? {};
      await supabase
        .from('integrations')
        .update({
          credentials: {
            ...prevCreds,
            access_token,
            refresh_token,
            realm_id,
            expires_at,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      log('Token refreshed successfully');
    }

    const apiBase = resolveQuickBooksAccountingApiBase(creds.api_environment);
    log('Using QuickBooks Accounting API base', { apiBase, storedEnv: creds.api_environment ?? '(fallback to Edge secrets)' });

    // ── Fetch purchases from QuickBooks (last 90 days) ─────────────────────────
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD

    const qbQuery = `SELECT * FROM Purchase WHERE TxnDate >= '${ninetyDaysAgo}' MAXRESULTS 200`;
    const qbUrl =
      `${apiBase}/v3/company/${realm_id}/query` + `?query=${encodeURIComponent(qbQuery)}`;

    log('Fetching QB purchases', { realm_id, since: ninetyDaysAgo });

    const qbResponse = await fetch(qbUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    if (!qbResponse.ok) {
      const statusCode = qbResponse.status;
      const errBody = await qbResponse.text();
      log('QuickBooks API error', { status: statusCode, body: errBody });

      if (statusCode === 401) {
        await supabase
          .from('integrations')
          .update({
            status: 'error',
            error_message: 'Token expired — reconnect QuickBooks',
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        return new Response(
          JSON.stringify({ error: 'Token expired — reconnect QuickBooks' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const mismatchHint =
        ' If you use a sandbox company, set QUICKBOOKS_USE_SANDBOX=true (or QUICKBOOKS_ENVIRONMENT=sandbox) on the Edge Function and reconnect; production companies need production API.';

      return new Response(
        JSON.stringify({
          error: 'QuickBooks API rejected the request',
          details: errBody.slice(0, 4000),
          hint: mismatchHint.trim(),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const qbData = await qbResponse.json();
    const purchases: any[] = qbData?.QueryResponse?.Purchase ?? [];
    log('Purchases fetched', { count: purchases.length });

    // ── Map purchases to expenses rows ─────────────────────────────────────────
    const expenseRows = purchases.map((purchase: any) => {
      const accountLabel = purchase.AccountRef?.name;
      const row: Record<string, any> = {
        hotel_id,
        date: purchase.TxnDate,
        category: mapQbAccountToExpenseCategory(accountLabel),
        subcategory: accountLabel ?? null,
        amount: Number(purchase.TotalAmt ?? 0),
        description: String(purchase.PrivateNote ?? purchase.PaymentType ?? 'QuickBooks expense').slice(0, 2000),
        vendor: purchase.EntityRef?.name ?? null,
        source: 'quickbooks',
        external_id: purchase.Id != null ? String(purchase.Id) : null,
      };

      return Object.fromEntries(
        Object.entries(row).filter(([key]) => EXPENSE_WRITABLE_KEYS.has(key)),
      );
    });

    // ── Upsert expenses ────────────────────────────────────────────────────────
    let syncedCount = 0;

    if (expenseRows.length > 0) {
      const { error: upsertError, count } = await supabase
        .from('expenses')
        .upsert(expenseRows, {
          onConflict: 'hotel_id,source,external_id',
          ignoreDuplicates: false,
        })
        .select('id', { count: 'exact', head: true });

      if (upsertError) {
        log('Upsert failed, attempting plain insert', upsertError.message);
        const { error: insertError } = await supabase
          .from('expenses')
          .insert(expenseRows);

        if (insertError) {
          log('Insert also failed', insertError.message);
          return new Response(
            JSON.stringify({
              error: 'Could not save expenses to the database',
              details: insertError.message,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        syncedCount = expenseRows.length;
      } else {
        syncedCount = count ?? expenseRows.length;
      }
    }

    // ── Update integration: last_sync_at + status active ──────────────────────
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        status: 'active',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    log('Sync complete', { syncedCount, hotel_id });

    return new Response(
      JSON.stringify({ success: true, synced_count: syncedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log('Unhandled error', String(err));
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
}));
