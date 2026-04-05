import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(sentryServe("get-welcome-link-data", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { slug } = await req.json()

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Welcome link slug is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Fetching welcome link data for slug:', slug)

    // First, get the welcome link to verify it's active
    const { data: welcomeLink, error: welcomeError } = await supabaseClient
      .from('welcome_links')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (welcomeError || !welcomeLink) {
      console.error('Welcome link not found or inactive:', welcomeError)
      return new Response(
        JSON.stringify({ error: 'Welcome link not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get job application data - only non-sensitive information needed for welcome process
    const { data: jobApplication, error: appError } = await supabaseClient
      .from('job_applications')
      .select(`
        id,
        first_name,
        last_name,
        email,
        job_role_id,
        job_roles (
          title,
          description,
          department,
          location,
          type
        )
      `)
      .eq('id', welcomeLink.application_id)
      .single()

    if (appError) {
      console.error('Error fetching job application:', appError)
      return new Response(
        JSON.stringify({ error: 'Job application not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get preboarding steps - SECURITY: Only return non-sensitive status fields
    // Do NOT return the 'data' field which contains sensitive info like:
    // - Emergency contact names, phone numbers, relationships
    // - Home addresses (street, city, state, zip)
    // - Preferred Google account emails
    const { data: steps, error: stepsError } = await supabaseClient
      .from('preboarding_steps')
      .select('id, step_type, status, completed_at, created_at, updated_at, welcome_link_id')
      .eq('welcome_link_id', welcomeLink.id)
      .order('created_at', { ascending: true })

    if (stepsError) {
      console.error('Error fetching preboarding steps:', stepsError)
      // Continue without steps if there's an error
    }

    return new Response(
      JSON.stringify({
        welcomeLink,
        jobApplication,
        steps: steps || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-welcome-link-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}));