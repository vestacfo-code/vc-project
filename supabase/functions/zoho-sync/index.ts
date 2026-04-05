import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(sentryServe("zoho-sync", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting Zoho sync for user:', user.id);

    // Get active integration
    const { data: integration, error: integrationError } = await supabase
      .from('zoho_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('No active Zoho integration found');
      return new Response(JSON.stringify({ error: 'No active Zoho integration found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh (Zoho tokens expire in 1 hour)
    const tokenExpiresAt = new Date(integration.token_expires_at);
    const now = new Date();
    let accessToken = integration.access_token;

    if (now >= tokenExpiresAt || (tokenExpiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
      console.log('Refreshing Zoho token...');
      const newTokens = await refreshZohoToken(integration.refresh_token);
      
      if (!newTokens) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      accessToken = newTokens.access_token;
      
      // Update tokens in database
      await supabase
        .from('zoho_integrations')
        .update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
      
      console.log('Token refreshed successfully');
    }

    const syncResults = {
      contacts: 0,
      invoices: 0,
      expenses: 0,
      bills: 0,
      accounts: 0,
      bank_accounts: 0,
      items: 0,
    };

    // Sync all data types
    syncResults.contacts = await syncDataType(
      supabase,
      integration,
      accessToken,
      'contacts',
      'contact_id'
    );

    syncResults.invoices = await syncDataType(
      supabase,
      integration,
      accessToken,
      'invoices',
      'invoice_id'
    );

    syncResults.expenses = await syncDataType(
      supabase,
      integration,
      accessToken,
      'expenses',
      'expense_id'
    );

    syncResults.bills = await syncDataType(
      supabase,
      integration,
      accessToken,
      'bills',
      'bill_id'
    );

    syncResults.accounts = await syncDataType(
      supabase,
      integration,
      accessToken,
      'chartofaccounts',
      'account_id'
    );

    syncResults.bank_accounts = await syncDataType(
      supabase,
      integration,
      accessToken,
      'bankaccounts',
      'account_id'
    );

    syncResults.items = await syncDataType(
      supabase,
      integration,
      accessToken,
      'items',
      'item_id'
    );

    console.log('Zoho sync completed:', syncResults);

    return new Response(JSON.stringify({
      success: true,
      synced: syncResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Zoho sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));

async function refreshZohoToken(refreshToken: string) {
  const clientId = Deno.env.get('ZOHO_CLIENT_ID')!;
  const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET')!;

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    console.error('Token refresh failed:', await response.text());
    return null;
  }

  return await response.json();
}

async function syncDataType(
  supabase: any,
  integration: any,
  accessToken: string,
  endpoint: string,
  idField: string
): Promise<number> {
  let count = 0;
  let page = 1;
  let hasMorePages = true;

  const baseUrl = `${integration.api_domain}/books/v3/${endpoint}`;
  const orgId = integration.organization_id;

  while (hasMorePages) {
    try {
      const url = `${baseUrl}?organization_id=${orgId}&page=${page}&per_page=200`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${endpoint} page ${page}:`, response.status);
        break;
      }

      const data = await response.json();
      const items = data[endpoint] || [];

      for (const item of items) {
        const zohoId = item[idField] || item.id;
        
        await supabase
          .from('zoho_data')
          .upsert({
            user_id: integration.user_id,
            integration_id: integration.id,
            data_type: endpoint,
            zoho_id: zohoId.toString(),
            data_json: item,
            last_synced: new Date().toISOString(),
          }, {
            onConflict: 'integration_id,data_type,zoho_id',
          });

        count++;
        
        // Rate limiting: 600ms delay (100 requests per minute)
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Check for more pages
      hasMorePages = data.page_context?.has_more_page || false;
      page++;

      console.log(`Synced ${count} ${endpoint} (page ${page - 1})`);

    } catch (error) {
      console.error(`Error syncing ${endpoint} page ${page}:`, error);
      break;
    }
  }

  return count;
}
