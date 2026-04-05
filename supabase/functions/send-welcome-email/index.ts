import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createResend, resendBaseSendFields } from "../_shared/resend.ts";

const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    created_at: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
  schema: string;
}

// Simple, clean HTML template optimized for dark/light mode email clients
const getFallbackTemplate = (firstName: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e0e0e0;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">
          Welcome to Vesta, ${firstName}
        </h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          You've taken the first step toward transforming how you manage your business finances.
        </p>
        
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e8e8e8;">
          <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Here's what you can do now:</h3>
          <ul style="color: #4a4a4a; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li>Connect your accounting software (QuickBooks, Xero, Wave, or Zoho)</li>
            <li>Upload financial documents for AI analysis</li>
            <li>Ask questions about your business finances in plain English</li>
            <li>Get AI-powered insights and recommendations</li>
          </ul>
        </div>
        
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
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));
    
    // Only process INSERT events on auth.users
    if (payload.type !== "INSERT") {
      console.log("Skipping non-INSERT event:", payload.type);
      return new Response(JSON.stringify({ message: "Not an INSERT event" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, raw_user_meta_data } = payload.record;
    const fullName = raw_user_meta_data?.full_name || '';
    const firstName = fullName.split(' ')[0] || 'there';

    console.log("Processing new user:", { email, fullName, firstName });

    const resend = createResend();
    if (!resend) {
      console.warn("RESEND_API_KEY not set — skipping welcome email");
      return new Response(
        JSON.stringify({ success: false, skipped: true, message: "RESEND_API_KEY not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Step 1: Add contact to Resend audience FIRST
    if (audienceId) {
      try {
        const contactResponse = await resend.contacts.create({
          email: email,
          firstName: firstName,
          unsubscribed: false,
          audienceId: audienceId,
        });
        console.log("Contact added to Resend audience successfully:", contactResponse);
      } catch (audienceError: any) {
        // Don't fail the whole function if audience add fails - log and continue
        console.error("Error adding contact to audience:", audienceError.message);
      }
    } else {
      console.warn("RESEND_AUDIENCE_ID not configured - skipping audience addition");
    }

    // Step 2: Try to use Resend template, fall back to custom HTML
    let emailResponse;
    let usedTemplate = false;
    
    try {
      // Try to find and use the Resend template
      console.log("Attempting to use Resend template 'untitled-template'...");
      
      // List templates to find "untitled-template"
      const templatesResponse = await resend.templates.list();
      console.log("Templates found:", JSON.stringify(templatesResponse));
      
      const template = templatesResponse.data?.find(
        (t: any) => t.name === 'untitled-template' || t.name.toLowerCase().includes('welcome')
      );
      
      if (template) {
        console.log("Found template:", template.id, template.name);
        
        // Get the full template content
        const templateData = await resend.templates.get(template.id);
        console.log("Template data retrieved");
        
        if (templateData.data?.html) {
          // Replace template variables with actual values
          // Common variable patterns: {{name}}, {{firstName}}, {name}, {firstName}, {{first_name}}
          let htmlContent = templateData.data.html;
          htmlContent = htmlContent.replace(/\{\{?\s*name\s*\}?\}/gi, firstName);
          htmlContent = htmlContent.replace(/\{\{?\s*firstName\s*\}?\}/gi, firstName);
          htmlContent = htmlContent.replace(/\{\{?\s*first_name\s*\}?\}/gi, firstName);
          htmlContent = htmlContent.replace(/\{\{?\s*fullName\s*\}?\}/gi, fullName || firstName);
          htmlContent = htmlContent.replace(/\{\{?\s*full_name\s*\}?\}/gi, fullName || firstName);
          
          emailResponse = await resend.emails.send({
            ...resendBaseSendFields(),
            to: [email],
            subject: templateData.data.subject || "Welcome to Vesta - Your AI CFO Journey Begins",
            html: htmlContent,
          });
          usedTemplate = true;
          console.log("Email sent using Resend template");
        }
      }
    } catch (templateError: any) {
      console.warn("Could not use Resend template, falling back to default:", templateError.message);
    }
    
    // Fallback to custom HTML if template wasn't used
    if (!usedTemplate) {
      console.log("Using fallback HTML template");
      emailResponse = await resend.emails.send({
        ...resendBaseSendFields(),
        to: [email],
        subject: "Welcome to Vesta - Your AI CFO Journey Begins",
        html: getFallbackTemplate(firstName),
      });
    }

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: usedTemplate ? "Welcome email sent using Resend template" : "Welcome email sent using fallback template",
      emailResponse,
      usedTemplate
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
