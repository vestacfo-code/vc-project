// @ts-nocheck
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
const siteBase = (envTrim('SITE_URL') ?? envTrim('PUBLIC_SITE_URL') ?? 'https://vesta.ai').replace(
  /\/$/,
  '',
);
const QB_REDIRECT_URI = envTrim('QUICKBOOKS_REDIRECT_URI') ?? `${siteBase}/integrations`;

/** Intuit *development* keys + sandbox companies require the sandbox data host (OAuth URLs are unchanged). */
function quickBooksApiBase(): string {
  const flag = (envTrim('QUICKBOOKS_USE_SANDBOX') ?? '').toLowerCase();
  const env = (envTrim('QUICKBOOKS_ENVIRONMENT') ?? '').toLowerCase();
  if (flag === 'true' || flag === '1' || env === 'sandbox' || env === 'development') {
    return 'https://sandbox-quickbooks.api.intuit.com';
  }
  return 'https://quickbooks.api.intuit.com';
}

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[QB-HOTEL-SYNC] ${step}${suffix}`);
};

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

        // Mark integration as errored
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

      // Persist updated credentials
      await supabase
        .from('integrations')
        .update({
          credentials: { access_token, refresh_token, realm_id, expires_at },
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      log('Token refreshed successfully');
    }

    // ── Determine which columns exist in the expenses table ────────────────────
    const { data: columnRows } = await supabase.rpc
      ? await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'expenses')
          .eq('table_schema', 'public')
      : { data: null };

    // Fallback: query information_schema via raw SQL using the service role
    let expenseColumns: Set<string> = new Set();
    if (columnRows && Array.isArray(columnRows)) {
      for (const row of columnRows) {
        expenseColumns.add(row.column_name);
      }
    } else {
      // Attempt via a known-safe query approach
      try {
        const { data: colData } = await supabase
          .from('information_schema.columns' as any)
          .select('column_name')
          .eq('table_name', 'expenses')
          .eq('table_schema', 'public');
        if (colData) {
          for (const row of colData as any[]) {
            expenseColumns.add(row.column_name);
          }
        }
      } catch (_e) {
        // If introspection fails, assume all standard columns exist except source
        expenseColumns = new Set(['id', 'hotel_id', 'date', 'category', 'amount', 'description', 'vendor']);
      }
    }

    // If we got no columns back, assume a safe default set
    if (expenseColumns.size === 0) {
      expenseColumns = new Set(['id', 'hotel_id', 'date', 'category', 'amount', 'description', 'vendor']);
    }

    const hasSource = expenseColumns.has('source');
    log('Expense table columns resolved', { hasSource, columns: [...expenseColumns] });

    // ── Fetch purchases from QuickBooks (last 90 days) ─────────────────────────
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD

    const qbQuery = `SELECT * FROM Purchase WHERE TxnDate >= '${ninetyDaysAgo}' MAXRESULTS 200`;
    const apiBase = quickBooksApiBase();
    const qbUrl =
      `${apiBase}/v3/company/${realm_id}/query` + `?query=${encodeURIComponent(qbQuery)}`;

    log('Fetching QB purchases', { realm_id, since: ninetyDaysAgo, apiBase });

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
        // Mark integration as errored
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

      return new Response(
        JSON.stringify({ error: 'QuickBooks API error', details: errBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const qbData = await qbResponse.json();
    const purchases: any[] = qbData?.QueryResponse?.Purchase ?? [];
    log('Purchases fetched', { count: purchases.length });

    // ── Map purchases to expenses rows ─────────────────────────────────────────
    const expenseRows = purchases.map((purchase: any) => {
      const row: Record<string, any> = {
        hotel_id,
        date: purchase.TxnDate,
        category: purchase.AccountRef?.name ?? 'Uncategorized',
        amount: purchase.TotalAmt,
        description: purchase.PrivateNote ?? purchase.PaymentType ?? 'QuickBooks expense',
        vendor: purchase.EntityRef?.name ?? null,
      };

      if (hasSource) {
        row.source = 'quickbooks';
      }

      // Only include keys that exist as columns
      return Object.fromEntries(
        Object.entries(row).filter(([key]) => expenseColumns.has(key)),
      );
    });

    // ── Upsert expenses ────────────────────────────────────────────────────────
    let syncedCount = 0;

    if (expenseRows.length > 0) {
      // Try upsert with conflict key; fall back to plain insert if constraint absent
      const { error: upsertError, count } = await supabase
        .from('expenses')
        .upsert(expenseRows, {
          onConflict: 'hotel_id,date,category,vendor',
          ignoreDuplicates: true,
        })
        .select('id', { count: 'exact', head: true });

      if (upsertError) {
        // If upsert fails (e.g., no unique constraint), try a plain insert ignoring duplicates
        log('Upsert failed, attempting plain insert', upsertError.message);
        const { error: insertError } = await supabase
          .from('expenses')
          .insert(expenseRows);

        if (insertError) {
          log('Insert also failed', insertError.message);
          // Non-fatal — continue to update last_sync_at
        } else {
          syncedCount = expenseRows.length;
        }
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
