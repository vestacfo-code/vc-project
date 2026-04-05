import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createResend, resendBaseSendFields } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'member_joined' | 'member_removed';
  teamId: string;
  memberEmail: string;
  memberName?: string;
  teamName?: string;
}

serve(sentryServe("team-notifications", async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, teamId, memberEmail, memberName, teamName } = await req.json() as NotificationRequest;

    console.log(`[TEAM-NOTIFICATIONS] Processing ${type} for ${memberEmail}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get team info and owner
    const { data: team } = await supabase
      .from('teams')
      .select('name, owner_id')
      .eq('id', teamId)
      .single();

    if (!team) {
      return new Response(
        JSON.stringify({ error: 'Team not found', success: false }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get owner's email and name
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', team.owner_id)
      .single();

    // Get owner's auth email if not in profile
    let ownerEmail = ownerProfile?.email;
    if (!ownerEmail) {
      const { data: authData } = await supabase.auth.admin.getUserById(team.owner_id);
      ownerEmail = authData?.user?.email;
    }

    if (!ownerEmail) {
      console.error('[TEAM-NOTIFICATIONS] Could not find owner email');
      return new Response(
        JSON.stringify({ error: 'Owner email not found', success: false }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ownerName = ownerProfile?.full_name || 'Team Owner';
    const ownerFirstName = ownerName.split(' ')[0];
    // Use owner's name for team name instead of generic "My Team"
    const displayTeamName = teamName || team.name === 'My Team' ? `${ownerFirstName}'s Team` : (team.name || `${ownerFirstName}'s Team`);
    const displayMemberName = memberName || memberEmail.split('@')[0];

    const resend = createResend();
    if (!resend) {
      return new Response(
        JSON.stringify({ error: "Email not configured (RESEND_API_KEY)", success: false }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (type === 'member_joined') {
      // Notify owner that someone joined
      await resend.emails.send({
        ...resendBaseSendFields(),
        to: [ownerEmail],
        subject: `${displayMemberName} has joined ${displayTeamName}`,
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
                </div>
                
                <div style="padding: 32px 24px;">
                  <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 600;">New Team Member</h2>
                  
                  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                    Hi ${ownerName},
                  </p>
                  
                  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                    Great news! <strong>${displayMemberName}</strong> (${memberEmail}) has accepted your invitation and joined <strong>${displayTeamName}</strong>.
                  </p>
                  
                  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                    They now have access to your team's financial data and can start collaborating with you.
                  </p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://vesta.ai/chat"
                       style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                      View Your Team
                    </a>
                  </div>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e8e8e8;">
                  <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                    © ${new Date().getFullYear()} Vesta. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[TEAM-NOTIFICATIONS] Member joined notification sent to owner');

    } else if (type === 'member_removed') {
      // Notify the removed member
      await resend.emails.send({
        ...resendBaseSendFields(),
        to: [memberEmail],
        subject: `You've been removed from ${displayTeamName}`,
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
                </div>
                
                <div style="padding: 32px 24px;">
                  <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 600;">Team Access Update</h2>
                  
                  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                    Hi ${displayMemberName},
                  </p>
                  
                  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                    Your access to <strong>${displayTeamName}</strong> on Vesta has been removed by the team owner.
                  </p>
                  
                  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                    You can still use your Vesta account independently. If you believe this was a mistake, please contact the team owner.
                  </p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://vesta.ai/chat" 
                       style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                      Continue Using Vesta
                    </a>
                  </div>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e8e8e8;">
                  <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                    © ${new Date().getFullYear()} Vesta. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[TEAM-NOTIFICATIONS] Member removed notification sent');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[TEAM-NOTIFICATIONS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}));