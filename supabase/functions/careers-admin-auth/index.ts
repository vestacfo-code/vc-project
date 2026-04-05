// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const updateStatusSchema = z.object({
  action: z.literal('updateStatus'),
  applicationId: z.string().uuid(),
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected']),
});

serve(sentryServe("careers-admin-auth", async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[CAREERS-ADMIN] Authorization header found')

    // Create admin client to verify JWT and get user
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract JWT token from auth header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify JWT token using admin client
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    
    console.log('[CAREERS-ADMIN] Auth result:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('[CAREERS-ADMIN] Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication', details: authError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[CAREERS-ADMIN] User authenticated:', user.email)

    // Check if user has admin, hr_staff, super_admin, or staff role
    const { data: roles, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'hr_staff', 'super_admin', 'staff'])

    if (roleError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const requestBody = await req.json()
    
    // Handle status update action
    if (requestBody.action === 'updateStatus') {
      const validation = updateStatusSchema.safeParse(requestBody);
      
      if (!validation.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid request data' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      const { applicationId, status } = validation.data;

      console.log(`Updating application ${applicationId} status to: ${status}`)
      
      // Use admin client to bypass RLS policies
      const { data, error: updateError } = await adminClient
        .from('job_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select();

      if (updateError) {
        console.error('[CAREERS-ADMIN] Update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update application status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Status update successful:', data)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Status updated successfully',
          application: data?.[0]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Default action: Fetch job applications and job roles using admin client
    const { data: applicationsData, error: appsError } = await adminClient
      .from('job_applications')
      .select(`
        *,
        job_roles (
          title,
          department,
          custom_questions
        )
      `)
      .order('created_at', { ascending: false })

    if (appsError) {
      console.error('Error loading applications:', appsError)
      throw appsError
    }

    const { data: rolesData, error: rolesError } = await adminClient
      .from('job_roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (rolesError) {
      console.error('Error loading roles:', rolesError)
      throw rolesError
    }

    return new Response(
      JSON.stringify({
        success: true,
        applications: applicationsData || [],
        jobRoles: rolesData || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[CAREERS-ADMIN] Error:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})