import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  format: z.enum(['json', 'csv']).default('json')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { format } = requestSchema.parse(body);

    // Fetch all user data
    const [
      profileData,
      documentsData,
      financialData,
      alertsData,
      notificationsData,
      creditsData,
      settingsData,
    ] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('documents').select('*').eq('user_id', user.id),
      supabaseClient.from('financial_data').select('*').eq('user_id', user.id),
      supabaseClient.from('alerts').select('*').eq('user_id', user.id),
      supabaseClient.from('notifications').select('*').eq('user_id', user.id),
      supabaseClient.from('user_credits').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('user_settings').select('*').eq('user_id', user.id).single(),
    ]);

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profileData.data,
      documents: documentsData.data || [],
      financial_data: financialData.data || [],
      alerts: alertsData.data || [],
      notifications: notificationsData.data || [],
      credits: creditsData.data,
      settings: settingsData.data,
      exported_at: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Simple CSV conversion for main profile data
      const csv = [
        'Field,Value',
        `Email,${user.email}`,
        `Name,${profileData.data?.full_name || ''}`,
        `Company,${profileData.data?.company_name || ''}`,
        `Created,${user.created_at}`,
        `Documents,${documentsData.data?.length || 0}`,
        `Financial Records,${financialData.data?.length || 0}`,
      ].join('\n');

      return new Response(csv, {
        headers: { ...corsHeaders, 'Content-Type': 'text/csv' },
      });
    }

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});