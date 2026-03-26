import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshWaveToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const waveClientId = Deno.env.get('WAVE_CLIENT_ID');
  const waveClientSecret = Deno.env.get('WAVE_CLIENT_SECRET');

  const response = await fetch('https://api.waveapps.com/oauth2/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: waveClientId!,
      client_secret: waveClientSecret!,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return await response.json();
}

async function fetchWaveData(accessToken: string, businessId: string, query: string) {
  const response = await fetch('https://gql.waveapps.com/graphql/public', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Wave API error:', errorText);
    throw new Error(`Wave API request failed: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active integration
    const { data: integration, error: integrationError } = await supabase
      .from('wave_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'No active Wave integration found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
    let accessToken = integration.access_token;
    const tokenExpiresAt = new Date(integration.token_expires_at);
    const now = new Date();

    if (tokenExpiresAt <= now) {
      console.log('Refreshing Wave access token...');
      const newTokens = await refreshWaveToken(integration.refresh_token);
      accessToken = newTokens.access_token;

      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
      await supabase
        .from('wave_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      console.log('Token refreshed successfully');
    }

    const businessId = integration.business_id;
    let syncedCount = 0;

    // Sync Customers
    console.log('Syncing customers...');
    const customersQuery = `
      query($businessId: ID!) {
        business(id: $businessId) {
          customers(page: 1, pageSize: 100) {
            edges {
              node {
                id
                name
                email
                currency { code }
                createdAt
                modifiedAt
              }
            }
          }
        }
      }
    `;

    const customersData = await fetchWaveData(accessToken, businessId, customersQuery.replace('$businessId', `"${businessId}"`));
    const customers = customersData?.data?.business?.customers?.edges || [];

    for (const edge of customers) {
      await supabase.from('wave_data').upsert({
        user_id: user.id,
        integration_id: integration.id,
        data_type: 'customer',
        wave_id: edge.node.id,
        data_json: edge.node,
        last_synced: new Date().toISOString(),
      }, { onConflict: 'integration_id,data_type,wave_id' });
      syncedCount++;
    }

    // Sync Invoices
    console.log('Syncing invoices...');
    const invoicesQuery = `
      query($businessId: ID!) {
        business(id: $businessId) {
          invoices(page: 1, pageSize: 100) {
            edges {
              node {
                id
                invoiceNumber
                status
                total
                amountDue
                invoiceDate
                dueDate
                customer { id name }
                createdAt
                modifiedAt
              }
            }
          }
        }
      }
    `;

    const invoicesData = await fetchWaveData(accessToken, businessId, invoicesQuery.replace('$businessId', `"${businessId}"`));
    const invoices = invoicesData?.data?.business?.invoices?.edges || [];

    for (const edge of invoices) {
      await supabase.from('wave_data').upsert({
        user_id: user.id,
        integration_id: integration.id,
        data_type: 'invoice',
        wave_id: edge.node.id,
        data_json: edge.node,
        last_synced: new Date().toISOString(),
      }, { onConflict: 'integration_id,data_type,wave_id' });
      syncedCount++;
    }

    // Sync Products
    console.log('Syncing products...');
    const productsQuery = `
      query($businessId: ID!) {
        business(id: $businessId) {
          products(page: 1, pageSize: 100) {
            edges {
              node {
                id
                name
                description
                unitPrice
                isSold
                defaultSalesTaxes { id name rate }
                createdAt
                modifiedAt
              }
            }
          }
        }
      }
    `;

    const productsData = await fetchWaveData(accessToken, businessId, productsQuery.replace('$businessId', `"${businessId}"`));
    const products = productsData?.data?.business?.products?.edges || [];

    for (const edge of products) {
      await supabase.from('wave_data').upsert({
        user_id: user.id,
        integration_id: integration.id,
        data_type: 'product',
        wave_id: edge.node.id,
        data_json: edge.node,
        last_synced: new Date().toISOString(),
      }, { onConflict: 'integration_id,data_type,wave_id' });
      syncedCount++;
    }

    console.log(`Wave sync completed. Synced ${syncedCount} items.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Synced ${syncedCount} items from Wave`,
      syncedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Wave sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
