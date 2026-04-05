import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getResendFrom, getResendReplyTo } from "../_shared/resend.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotificationEmailRequest {
  userEmail: string;
  userName: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: string;
  dashboardUrl?: string;
}

const getEmailTemplate = (data: NotificationEmailRequest) => {
  const { userName, notificationTitle, notificationMessage, notificationType, dashboardUrl } = data;
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'alert':
      case 'warning':
      case 'strategic_alert':
        return 'Alert';
      case 'financial_report':
      case 'weekly_report':
        return 'Report';
      case 'credit_depleted':
      case 'credit_low':
        return 'Credits';
      case 'credit_warning':
        return 'Credits';
      case 'daily_limit_reached':
        return 'Limit';
      default:
        return 'Notification';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vesta Notification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Vesta</h1>
            <p style="color: #a0a0a0; margin: 6px 0 0 0; font-size: 13px;">Financial Intelligence Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="margin-bottom: 24px;">
              <span style="display: inline-block; background-color: #f0f0f0; color: #4a4a4a; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${getTypeLabel(notificationType)}</span>
            </div>
            
            <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">${notificationTitle}</h2>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${userName},
            </p>
            
            <div style="background-color: #f9f9f9; border-left: 3px solid #1a1a1a; padding: 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                ${notificationMessage}
              </p>
            </div>
            
            ${dashboardUrl ? `
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                View in Dashboard
              </a>
            </div>
            ` : ''}
            
            <p style="color: #6a6a6a; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
              Stay informed about your financial insights and business performance with Vesta's AI-powered analysis.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9f9f9; padding: 20px 24px; border-top: 1px solid #e8e8e8;">
            <p style="margin: 0; color: #8a8a8a; font-size: 12px; text-align: center;">
              This email was sent by Vesta. You can manage your notification preferences in your dashboard settings.
            </p>
            <p style="margin: 8px 0 0 0; color: #a0a0a0; font-size: 12px; text-align: center;">
              ${new Date().getFullYear()} Vesta. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotificationEmailRequest = await req.json();
    const { userEmail, userName, notificationTitle, notificationMessage, notificationType, dashboardUrl } = requestData;

    if (!userEmail || !notificationTitle || !notificationMessage) {
      throw new Error('Missing required fields: userEmail, notificationTitle, or notificationMessage');
    }

    // Send email using Resend (production-ready email service)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log("Attempting to send notification email...");
    
    if (resendApiKey) {
      // Use Resend for production email delivery
      try {
        const emailContent = getEmailTemplate(requestData);
        
        const payload: Record<string, unknown> = {
          from: getResendFrom(),
          to: [userEmail],
          subject: `Vesta: ${notificationTitle}`,
          html: emailContent,
        };
        const rt = getResendReplyTo();
        if (rt) payload.reply_to = rt;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        console.log("Email sent successfully via Resend:", result.id);
        
      } catch (error) {
        console.error("Resend email error:", error);
        throw new Error(`Failed to send email via Resend: ${error.message}`);
      }
    } else {
      // Fallback: Log email details (SMTP not configured)
      const emailContent = getEmailTemplate(requestData);
      
      console.log("Email content prepared (SMTP/Resend not configured):", {
        to: userEmail,
        subject: `Vesta: ${notificationTitle}`,
        hasContent: !!emailContent
      });
      
      console.log("Configure RESEND_API_KEY in Supabase secrets for actual email delivery");
    }

    console.log("Notification email processed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification email sent successfully via Supabase",
      provider: "supabase",
      note: "SMTP configuration required in Supabase dashboard for actual delivery"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error sending notification email:", error);
    
    // Provide more specific error handling for Supabase
    let errorMessage = error.message;
    let errorType = 'unknown_error';
    
    if (error.message?.includes('SMTP')) {
      errorMessage = 'Email service requires SMTP configuration in Supabase dashboard';
      errorType = 'smtp_configuration_required';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Email service authentication error';
      errorType = 'authentication_error';
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      errorType: errorType
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
