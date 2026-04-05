import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createResend, resendBaseSendFields } from "../_shared/resend.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ApplicationConfirmationRequest {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, jobTitle, department }: ApplicationConfirmationRequest = await req.json();

    if (!email || !firstName || !jobTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-application-confirmation] Sending to:', email, 'for role:', jobTitle);

    const resend = createResend();
    if (!resend) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResult = await resend.emails.send({
      ...resendBaseSendFields(),
      to: [email],
      subject: `Thank You for Applying to ${jobTitle} at Vesta`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e0e0e0;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">
                Thank You, ${firstName}
              </h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We've received your application for <strong>${jobTitle}</strong> in our ${department} team.
              </p>
              
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e8e8e8;">
                <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">What happens next?</h3>
                <ul style="color: #4a4a4a; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li>Our team will carefully review your application</li>
                  <li>If your profile matches our needs, we'll reach out within 1-2 weeks</li>
                  <li>We may schedule an initial phone or video interview</li>
                  <li>You can check your application status anytime</li>
                </ul>
              </div>
              
              <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 24px 0;">
                We appreciate your interest in joining Vesta. We're on a mission to democratize financial intelligence for small businesses, and we're excited that you want to be part of that journey.
              </p>
              
              <a href="https://vesta.ai/careers" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                Explore More Opportunities
              </a>
              
              <p style="color: #6a6a6a; font-size: 13px; margin-top: 32px;">
                Questions? Reply to this email or contact us at <a href="mailto:careers@vesta.ai" style="color: #1a1a1a;">careers@vesta.ai</a>
              </p>
            </div>
            
            <p style="text-align: center; color: #8a8a8a; font-size: 12px; margin-top: 24px;">
              ${new Date().getFullYear()} Vesta. All rights reserved.<br>
              <a href="https://vesta.ai/privacy" style="color: #8a8a8a;">Privacy Policy</a> | <a href="https://vesta.ai/terms" style="color: #8a8a8a;">Terms of Service</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[send-application-confirmation] Result:', JSON.stringify(emailResult));

    if (emailResult.error) {
      return new Response(
        JSON.stringify({ error: emailResult.error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: emailResult.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[send-application-confirmation] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
