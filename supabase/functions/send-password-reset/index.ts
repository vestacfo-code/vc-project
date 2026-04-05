import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createResend, resendBaseSendFields } from "../_shared/resend.ts";

// Production domain for password reset redirects
const PRODUCTION_DOMAIN = "https://vesta.ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

serve(sentryServe("send-password-reset", async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-password-reset] Processing reset for:', email);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Use provided redirectUrl (from frontend) or fall back to production domain
    // This allows testing in preview environments
    const finalRedirectUrl = redirectUrl || `${PRODUCTION_DOMAIN}/auth`;
    console.log('[send-password-reset] Redirect URL:', finalRedirectUrl);

    // Generate password reset link using Supabase Admin API
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: finalRedirectUrl
      }
    });

    if (resetError) {
      console.error('[send-password-reset] Error generating reset link:', resetError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists, a reset email has been sent.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resetLink = data?.properties?.action_link;
    
    if (!resetLink) {
      console.error('[send-password-reset] No reset link generated');
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists, a reset email has been sent.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-password-reset] Reset link generated, sending email...');

    const resend = createResend();
    if (!resend) {
      console.error('[send-password-reset] RESEND_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Email delivery is not configured. Please contact support.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResult = await resend.emails.send({
      ...resendBaseSendFields(),
      to: [email],
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e0e0e0;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; font-weight: 600; text-align: center;">
                Reset Your Password
              </h1>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset the password for your Vesta account. Click the button below to set a new password:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6a6a6a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #6a6a6a; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 32px 0;">
              
              <p style="color: #8a8a8a; font-size: 12px; text-align: center; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #4a4a4a; word-break: break-all;">${resetLink}</a>
              </p>
            </div>
            
            <p style="text-align: center; color: #8a8a8a; font-size: 12px; margin-top: 24px;">
              © ${new Date().getFullYear()} Vesta. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[send-password-reset] Email result:', JSON.stringify(emailResult));

    if (emailResult.error) {
      console.error('[send-password-reset] Resend error:', emailResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent successfully.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[send-password-reset] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
