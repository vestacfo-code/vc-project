// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  syncType: z.enum(['full', 'customers', 'items', 'accounts', 'vendors', 'employees', 'invoices', 'payments', 'salesreceipts', 'bills', 'expenses', 'creditnotes', 'estimates', 'purchaseorders', 'taxrates', 'classes', 'departments'])
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a team member - if so, get the owner's integration
    let targetUserId = user.id;
    
    // Check team membership
    const { data: teamMembership } = await supabaseClient
      .from('team_members')
      .select('team_id, role, teams!inner(owner_id)')
      .eq('user_id', user.id)
      .neq('role', 'owner')
      .limit(1)
      .maybeSingle();
    
    if (teamMembership && (teamMembership as any).teams?.owner_id) {
      // User is a team member - use owner's integration
      targetUserId = (teamMembership as any).teams.owner_id;
      console.log(`[QB-Sync] Team member ${user.id} syncing for owner ${targetUserId}`);
    }

    // Get user's QuickBooks integration (or owner's for team members)
    const { data: integrations } = await supabaseClient
      .from('quickbooks_integrations')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const integration = integrations?.[0];

    if (!integration) {
      return new Response(JSON.stringify({ error: 'No QuickBooks integration found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh (refresh 5 minutes before expiry for safety)
    const tokenExpiresAt = new Date(integration.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    let accessToken = integration.access_token;

    if (fiveMinutesFromNow >= tokenExpiresAt) {
      console.log('Refreshing QuickBooks token (expires at:', integration.token_expires_at, ')...');
      
      try {
        const refreshResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${Deno.env.get('QUICKBOOKS_CLIENT_ID')}:${Deno.env.get('QUICKBOOKS_CLIENT_SECRET')}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: integration.refresh_token
          })
        });

        const refreshTokens = await refreshResponse.json();
        
        console.log('Token refresh response status:', refreshResponse.status);
        
        if (refreshTokens.error || !refreshResponse.ok) {
          console.error('Token refresh failed:', {
            status: refreshResponse.status,
            error: refreshTokens.error,
            description: refreshTokens.error_description,
            response: refreshTokens
          });
          
          // Check if it's an invalid_grant error (refresh token expired)
          if (refreshTokens.error === 'invalid_grant') {
            return new Response(JSON.stringify({ 
              error: 'QuickBooks connection expired. Please reconnect your account.',
              details: 'Your QuickBooks refresh token has expired. Please disconnect and reconnect your QuickBooks account.',
              reconnect_required: true
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          return new Response(JSON.stringify({ 
            error: 'QuickBooks connection error. Please try again.',
            details: refreshTokens.error_description || refreshTokens.error || 'Token refresh failed'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        accessToken = refreshTokens.access_token;
        
        // Update tokens in database
        const { error: updateError } = await supabaseClient
          .from('quickbooks_integrations')
          .update({
            access_token: refreshTokens.access_token,
            refresh_token: refreshTokens.refresh_token || integration.refresh_token,
            token_expires_at: new Date(Date.now() + (refreshTokens.expires_in * 1000)).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', integration.id);
        
        if (updateError) {
          console.error('Failed to update tokens in database:', updateError);
          // Continue anyway - tokens are valid for this request
        }
        
        console.log('Token refresh successful');
      } catch (refreshError) {
        console.error('Token refresh exception:', refreshError);
        return new Response(JSON.stringify({ 
          error: 'Failed to refresh QuickBooks connection',
          details: refreshError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    const { syncType } = requestSchema.parse(body);
    console.log('Syncing QuickBooks data:', { syncType, realmId: integration.realm_id });

    const syncOperations = [];
    
    // Define what data to sync based on syncType - comprehensive QuickBooks data
    const dataTypes = syncType === 'full' ? 
      ['customers', 'items', 'accounts', 'vendors', 'employees', 'invoices', 'payments', 'salesreceipts', 'bills', 'expenses', 'creditnotes', 'estimates', 'purchaseorders', 'taxrates', 'classes', 'departments'] :
      [syncType];

    for (const dataType of dataTypes) {
      let endpoint = '';
      
      switch (dataType) {
        case 'customers':
          endpoint = 'customer';
          break;
        case 'items':
          endpoint = 'item';
          break;
        case 'accounts':
          endpoint = 'account';
          break;
        case 'vendors':
          endpoint = 'vendor';
          break;
        case 'employees':
          endpoint = 'employee';
          break;
        case 'invoices':
          endpoint = 'invoice';
          break;
        case 'payments':
          endpoint = 'payment';
          break;
        case 'salesreceipts':
          endpoint = 'salesreceipt';
          break;
        case 'bills':
          endpoint = 'bill';
          break;
        case 'expenses':
          endpoint = 'purchase';
          break;
        case 'creditnotes':
          endpoint = 'creditmemo';
          break;
        case 'estimates':
          endpoint = 'estimate';
          break;
        case 'purchaseorders':
          endpoint = 'purchaseorder';
          break;
        case 'taxrates':
          endpoint = 'taxrate';
          break;
        case 'classes':
          endpoint = 'class';
          break;
        case 'departments':
          endpoint = 'department';
          break;
        default:
          continue;
      }

      try {
        const response = await fetch(
          `${integration.base_url}/v3/company/${integration.realm_id}/query?query=SELECT * FROM ${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const items = data.QueryResponse?.[endpoint.charAt(0).toUpperCase() + endpoint.slice(1)] || [];
          
          console.log(`Fetched ${items.length} ${dataType}`);

          // Store each item in the database
          for (const item of items) {
            try {
              const { error: insertError } = await supabaseClient
                .from('quickbooks_data')
                .upsert({
                  integration_id: integration.id,
                  user_id: user.id,
                  data_type: dataType,
                  quickbooks_id: item.Id,
                  data_json: item,
                  last_synced: new Date().toISOString()
                }, {
                  onConflict: 'integration_id,data_type,quickbooks_id'
                });
              
              if (insertError) {
                console.error(`Error inserting ${dataType} item ${item.Id}:`, insertError);
              }
            } catch (error) {
              console.error(`Exception inserting ${dataType} item ${item.Id}:`, error);
            }
          }

          syncOperations.push({ type: dataType, count: items.length, status: 'success' });
        } else {
          console.error(`Failed to fetch ${dataType}:`, response.status, await response.text());
          syncOperations.push({ type: dataType, count: 0, status: 'error', error: response.statusText });
        }
      } catch (error) {
        console.error(`Error syncing ${dataType}:`, error);
        syncOperations.push({ type: dataType, count: 0, status: 'error', error: error.message });
      }
    }

    // Update integration last sync time
    await supabaseClient
      .from('quickbooks_integrations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', integration.id);

    return new Response(JSON.stringify({ 
      success: true,
      syncOperations,
      message: 'QuickBooks data synced successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('QuickBooks sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});