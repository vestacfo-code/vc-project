import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  email: z.string().email().max(255),
  teamName: z.string().min(1).max(100),
  inviterName: z.string().min(1).max(100),
  role: z.enum(['super_admin', 'admin', 'member', 'viewer']),
  teamId: z.string().uuid(),
  redirectTo: z.string().url().optional(),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[INVITE-TEAM] Received request");
    
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', success: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, teamName, inviterName, role, teamId, redirectTo } = validation.data;

    console.log("Processing invitation for:", email, "to team:", teamName);

    // Initialize Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already exists by looking up in profiles table
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    const existingUserId = existingProfile?.user_id;
    
    if (existingUserId) {
      console.log("User already exists, adding directly to team:", email);
      
      // Add user directly to team since they already have an account
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: existingUserId,
          role: role,
        });

      if (memberError) {
        console.error("[INVITE-TEAM] Member add error:", memberError);
        // If it's a duplicate, that's fine - user already in team
        if (memberError.code !== '23505') {
          return new Response(
            JSON.stringify({ error: 'Failed to add user to team', success: false }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      // Send custom invitation email using Resend
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      try {
        await resend.emails.send({
          from: "Vesta Team <support@vesta.ai>",
          to: [email],
          subject: `You've been invited to join ${teamName} on Vesta`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
                  <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Vesta</h1>
                    <p style="color: #a0a0a0; margin: 6px 0 0 0; font-size: 13px;">Financial Intelligence Platform</p>
                  </div>
                  
                  <div style="padding: 32px 24px;">
                    <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 600;">You've been invited to join ${teamName}</h2>
                    
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                      Hi there, ${inviterName} has invited you to join the <strong>${teamName}</strong> team on Vesta.
                    </p>
                    
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                      Since you already have a Vesta account, you can access the team immediately by logging into your dashboard.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${redirectTo || 'https://vesta.ai/chat'}" 
                         style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                        Access Team Dashboard
                      </a>
                    </div>
                    
                    <p style="color: #6a6a6a; font-size: 13px; line-height: 1.6;">
                      Your role in this team will be: <strong>${role}</strong>
                    </p>
                  </div>
                  
                  <div style="background-color: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e8e8e8;">
                    <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                      ${new Date().getFullYear()} Vesta. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log("Custom invitation email sent to existing user");
      } catch (emailError) {
        console.error("Error sending custom invitation email:", emailError);
        // Don't throw here as the team addition was successful
      }

      // Remove the pending invitation from team_invitations table
      await supabase
        .from('team_invitations')
        .delete()
        .eq('email', email)
        .eq('team_id', teamId);

      return new Response(JSON.stringify({
        success: true,
        message: "User added to team successfully",
        userExists: true
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } else {
      console.log("New user, sending invitation email via Resend:", email);
      
      // For new users, we'll send a custom email with Resend that directs them to sign up
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const signupUrl = `https://vesta.ai/auth?email=${encodeURIComponent(email)}&team=${teamId}&role=${role}`;
      
      try {
        await resend.emails.send({
          from: "Vesta Team <support@vesta.ai>",
          to: [email],
          subject: `You've been invited to join ${teamName} on Vesta`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
                  <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Vesta</h1>
                    <p style="color: #a0a0a0; margin: 6px 0 0 0; font-size: 13px;">Financial Intelligence Platform</p>
                  </div>
                  
                  <div style="padding: 32px 24px;">
                    <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 600;">You've been invited to join ${teamName}</h2>
                    
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                      Hi there, ${inviterName} has invited you to join the <strong>${teamName}</strong> team on Vesta.
                    </p>
                    
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                      Click the button below to create your account and join the team.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${signupUrl}" 
                         style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                        Accept Invitation
                      </a>
                    </div>
                    
                    <p style="color: #6a6a6a; font-size: 13px; line-height: 1.6;">
                      Your role in this team will be: <strong>${role}</strong>
                    </p>
                    
                    <p style="color: #9a9a9a; font-size: 12px; line-height: 1.6; margin-top: 24px;">
                      This invitation expires in 7 days.
                    </p>
                  </div>
                  
                  <div style="background-color: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e8e8e8;">
                    <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                      ${new Date().getFullYear()} Vesta. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log("Invitation email sent to new user via Resend");
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        return new Response(
          JSON.stringify({ error: 'Failed to send invitation email', success: false }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Team invitation sent successfully",
        userExists: false
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  } catch (error: any) {
    console.error("[INVITE-TEAM] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred processing the invitation',
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
