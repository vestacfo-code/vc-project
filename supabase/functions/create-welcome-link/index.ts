
// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { applicationId, applicantName, startDate, supervisors } = await req.json()

    console.log('Creating welcome link for:', { applicationId, applicantName, startDate, supervisors })

    // Generate a unique slug
    const slug = crypto.randomUUID()

    // Create the welcome link record
    const { data: welcomeLink, error: insertError } = await supabaseClient
      .from('welcome_links')
      .insert({
        slug,
        application_id: applicationId,
        applicant_name: applicantName,
        start_date: startDate,
        supervisors: supervisors || []
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating welcome link:', insertError)
      throw insertError
    }

    console.log('Welcome link created successfully:', welcomeLink)

    return new Response(
      JSON.stringify({ 
        success: true, 
        welcomeLink,
        url: `https://vesta.ai/welcome/${slug}`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in create-welcome-link function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})
