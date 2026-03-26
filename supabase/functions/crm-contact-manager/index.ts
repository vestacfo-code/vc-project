import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    const { action, data } = await req.json();

    console.log(`[CRM Contact Manager] Action: ${action} by user: ${user.email}`);

    switch (action) {
      case 'create': {
        const { data: newContact, error: createError } = await supabaseClient
          .from('crm_contacts')
          .insert(data)
          .select()
          .single();

        if (createError) throw createError;

        console.log(`[CRM Contact Manager] Contact created by ${user.email}:`, newContact.id);

        return new Response(
          JSON.stringify({ success: true, contact: newContact }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const { data: updatedContact, error: updateError } = await supabaseClient
          .from('crm_contacts')
          .update(data.updates)
          .eq('id', data.contactId)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log(`[CRM Contact Manager] Contact updated by ${user.email}:`, updatedContact.id);

        return new Response(
          JSON.stringify({ success: true, contact: updatedContact }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { error: deleteError } = await supabaseClient
          .from('crm_contacts')
          .delete()
          .eq('id', data.contactId);

        if (deleteError) throw deleteError;

        console.log(`[CRM Contact Manager] Contact deleted by ${user.email}:`, data.contactId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'bulk_tag': {
        const { error: bulkError } = await supabaseClient
          .from('crm_contacts')
          .update({ tags: data.tags })
          .in('id', data.contactIds);

        if (bulkError) throw bulkError;

        console.log(`[CRM Contact Manager] Bulk tag by ${user.email}:`, data.contactIds.length, 'contacts');

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[CRM Contact Manager] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});