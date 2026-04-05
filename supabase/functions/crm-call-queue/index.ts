import { sentryServe } from "../_shared/sentry-edge.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(sentryServe("crm-call-queue", async (req) => {
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { filters = {} } = await req.json();

    console.log(`[CRM Call Queue] Loading queue for user: ${user.email}`);

    // Build query with filters
    let query = supabaseClient
      .from('crm_contacts')
      .select(`
        *,
        last_caller:profiles!crm_contacts_last_contacted_by_fkey(full_name, email)
      `);

    // Apply filters
    if (filters.status) {
      query = query.in('status', Array.isArray(filters.status) ? filters.status : [filters.status]);
    } else {
      query = query.in('status', ['lead', 'prospect']);
    }

    if (filters.assignedToMe) {
      query = query.or(`assigned_to.eq.${user.id},last_contacted_by.eq.${user.id}`);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Order by priority:
    // 1. Overdue follow-ups first
    // 2. Then by next_follow_up date
    // 3. Then by oldest last_contacted_at
    query = query.order('next_follow_up', { ascending: true, nullsFirst: false });

    const { data: contacts, error: queryError } = await query;

    if (queryError) throw queryError;

    console.log(`[CRM Call Queue] Loaded ${contacts?.length || 0} contacts for ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts: contacts || [],
        totalCount: contacts?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CRM Call Queue] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});