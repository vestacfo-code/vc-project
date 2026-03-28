import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SubscriptionEmailRequest {
  email: string;
  userName: string;
  tier: string;
  type: 'welcome' | 'upgrade' | 'downgrade' | 'cancelled';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, userName, tier, type }: SubscriptionEmailRequest = await req.json();

    if (!email || !tier || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = userName?.split(' ')[0] || 'there';
    console.log('[send-subscription-email] Sending to:', email, 'type:', type, 'tier:', tier);

    const tierDisplay = tier === 'ceo' ? 'CFO' : tier === 'scale' ? 'Scale' : 'Founder';
    const tierCredits = tier === 'ceo' ? 250 : tier === 'scale' ? 150 : 30;

    let subject = '';
    let headline = '';
    let message = '';

    switch (type) {
      case 'welcome':
      case 'upgrade':
        subject = `Welcome to Vesta ${tierDisplay}`;
        headline = `Welcome to ${tierDisplay}, ${firstName}`;
        message = `You now have access to ${tierCredits} AI credits per month and all the powerful features of the ${tierDisplay} plan.`;
        break;
      case 'downgrade':
        subject = `Your Vesta Plan Has Changed`;
        headline = `Plan Update Confirmed`;
        message = `Your plan has been updated to ${tierDisplay}. You now have ${tierCredits} AI credits per month.`;
        break;
      case 'cancelled':
        subject = `We're Sorry to See You Go`;
        headline = `Subscription Cancelled`;
        message = `Your subscription has been cancelled. You'll continue to have access until the end of your billing period.`;
        break;
    }

    const emailResult = await resend.emails.send({
      from: 'Vesta <support@vesta.ai>',
      to: [email],
      subject,
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
                ${headline}
              </h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${message}
              </p>
              
              ${type === 'welcome' || type === 'upgrade' ? `
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e8e8e8;">
                <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Your ${tierDisplay} Benefits:</h3>
                <ul style="color: #4a4a4a; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li><strong>${tierCredits} AI credits</strong> per month</li>
                  <li>Unlimited document uploads</li>
                  <li>AI-powered financial insights</li>
                  <li>Priority support</li>
                  ${tier === 'ceo' ? '<li>Advanced strategic alerts</li><li>Custom reporting</li>' : ''}
                </ul>
              </div>
              ` : ''}
              
              <a href="https://vesta.ai/dashboard" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                Go to Dashboard
              </a>
              
              <p style="color: #6a6a6a; font-size: 13px; margin-top: 32px;">
                Questions? Reply to this email or visit our <a href="https://vesta.ai/support" style="color: #1a1a1a;">support page</a>.
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

    console.log('[send-subscription-email] Result:', JSON.stringify(emailResult));

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
    console.error('[send-subscription-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
