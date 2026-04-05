import { sentryServe } from "../_shared/sentry-edge.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactImportData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: string;
  source?: string;
  linkedin_url?: string;
  website?: string;
  tags?: string[];
  notes?: string;
}

Deno.serve(sentryServe("crm-bulk-import", async (req) => {
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

    const { contacts, fileName, duplicateHandling = 'skip' } = await req.json();

    console.log(`[CRM Bulk Import] Started by user: ${user.email}, ${contacts.length} contacts`);

    // Create import history record
    const { data: importRecord, error: importRecordError } = await supabaseClient
      .from('crm_import_history')
      .insert({
        file_name: fileName,
        total_records: contacts.length,
        import_type: 'contacts',
        status: 'processing'
      })
      .select()
      .single();

    if (importRecordError) throw importRecordError;

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string; data: any }> = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact: ContactImportData = contacts[i];

      try {
        // Validate required fields - must have name (first, last, or company)
        if (!contact.first_name && !contact.last_name && !contact.company) {
          throw new Error('Name (first, last, or company) required');
        }

        if (!contact.email && !contact.phone) {
          throw new Error('Email or phone required');
        }

        // Check for duplicates
        if (duplicateHandling !== 'create_new') {
          let duplicateQuery = supabaseClient
            .from('crm_contacts')
            .select('id');

          if (contact.email) {
            duplicateQuery = duplicateQuery.eq('email', contact.email);
          } else if (contact.phone) {
            duplicateQuery = duplicateQuery.eq('phone', contact.phone);
          }

          const { data: existingContact } = await duplicateQuery.maybeSingle();

          if (existingContact) {
            if (duplicateHandling === 'skip') {
              console.log(`[CRM Bulk Import] Skipping duplicate: ${contact.email || contact.phone}`);
              successCount++;
              continue;
            } else if (duplicateHandling === 'update') {
              // Update existing contact
              const { error: updateError } = await supabaseClient
                .from('crm_contacts')
                .update(contact)
                .eq('id', existingContact.id);

              if (updateError) throw updateError;
              successCount++;
              continue;
            }
          }
        }

        // Insert new contact
        const { error: insertError } = await supabaseClient
          .from('crm_contacts')
          .insert({
            ...contact,
            source: contact.source || 'import'
          });

        if (insertError) throw insertError;

        successCount++;
      } catch (error) {
        console.error(`[CRM Bulk Import] Error on row ${i + 1}:`, error);
        errorCount++;
        errors.push({
          row: i + 1,
          error: error.message,
          data: contact
        });
      }
    }

    // Update import history
    await supabaseClient
      .from('crm_import_history')
      .update({
        status: 'completed',
        successful_records: successCount,
        failed_records: errorCount,
        error_log: { errors }
      })
      .eq('id', importRecord.id);

    console.log(`[CRM Bulk Import] Completed by ${user.email}: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        importId: importRecord.id,
        successful: successCount,
        failed: errorCount,
        errors: errors.map(e => ({ row: e.row, message: e.error }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CRM Bulk Import] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
}));