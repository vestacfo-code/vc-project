import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createResend, resendBaseSendFields } from "../_shared/resend.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SupportTicketRequest {
  subject: string;
  description: string;
  priority: string;
}

serve(sentryServe("create-support-ticket", async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, description, priority }: SupportTicketRequest = await req.json();

    // Validate input
    if (!subject || !description) {
      return new Response(
        JSON.stringify({ error: 'Subject and description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'User';
    const userEmail = user.email || '';

    console.log('[create-support-ticket] Creating ticket for:', userName, userEmail);

    // Insert ticket into database
    const { data: ticket, error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        user_email: userEmail,
        user_name: userName,
        subject,
        description,
        priority: priority || 'normal',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting ticket:', insertError);
      throw new Error('Failed to create support ticket');
    }

    console.log('[create-support-ticket] Ticket created:', ticket.ticket_number);

    const resend = createResend();

    // Send email to support team
    try {
      if (!resend) {
        console.warn('[create-support-ticket] RESEND_API_KEY not set — skipping emails');
      } else {
      console.log('[create-support-ticket] Sending support email to support@vesta.ai...');
      const supportEmailResult = await resend.emails.send({
        ...resendBaseSendFields(),
        replyTo: 'support@vesta.ai',
        to: ['support@vesta.ai'],
        subject: `[Ticket ${ticket.ticket_number}] New Support Request from ${userName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
                <h1 style="color: #1a1a1a; font-size: 20px; margin: 0 0 24px 0; font-weight: 600;">New Support Ticket</h1>
                <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 20px 0;">A new support ticket has been created:</p>
                
                <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9; width: 120px;">Ticket</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${ticket.ticket_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9;">From</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${userName} (${userEmail})</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9;">Subject</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${subject}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9;">Priority</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${priority}</td>
                  </tr>
                </table>
                
                <h2 style="color: #1a1a1a; font-size: 16px; margin: 24px 0 12px 0; font-weight: 600;">Description</h2>
                <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 16px; border-radius: 6px; color: #4a4a4a; font-size: 14px; line-height: 1.6; border: 1px solid #e8e8e8; margin: 0;">${description}</p>
                
                <p style="margin-top: 24px;">
                  <a href="https://vesta.ai/admin?tab=support&ticket=${ticket.id}" 
                     style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                    View Ticket in Admin
                  </a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[create-support-ticket] Support email result:', JSON.stringify(supportEmailResult));
      }
    } catch (emailError) {
      console.error('[create-support-ticket] Failed to send support email:', JSON.stringify(emailError));
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      if (!resend) {
        // already logged above
      } else {
      console.log('[create-support-ticket] Sending confirmation email to:', userEmail);
      const userEmailResult = await resend.emails.send({
        ...resendBaseSendFields(),
        replyTo: 'support@vesta.ai',
        to: [userEmail],
        subject: `Your Support Ticket ${ticket.ticket_number} Has Been Created`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
                <h1 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Support Ticket Created</h1>
                <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ${userName.split(' ')[0]},</p>
                
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">We've received your support request and created ticket <strong>${ticket.ticket_number}</strong>.</p>
                
                <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9; width: 130px;">Ticket Number</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${ticket.ticket_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9;">Subject</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${subject}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #1a1a1a; background-color: #f9f9f9;">Priority</td>
                    <td style="padding: 10px 12px; border: 1px solid #e0e0e0; color: #4a4a4a;">${priority}</td>
                  </tr>
                </table>
                
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">Our team will review your request and get back to you as soon as possible.</p>
                
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">Best regards,<br>The Vesta Team</p>
              </div>
              
              <p style="text-align: center; color: #8a8a8a; font-size: 12px; margin-top: 24px;">
                ${new Date().getFullYear()} Vesta. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[create-support-ticket] User confirmation email result:', JSON.stringify(userEmailResult));
      }
    } catch (emailError) {
      console.error('[create-support-ticket] Failed to send user email:', JSON.stringify(emailError));
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[create-support-ticket] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
