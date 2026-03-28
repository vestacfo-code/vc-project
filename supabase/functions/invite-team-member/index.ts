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
  hotel_id: z.string().uuid(),
  email: z.string().email().max(255),
  role: z.enum(["owner", "admin", "viewer"]),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[INVITE-TEAM-MEMBER] Received request");

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", success: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { hotel_id, email, role } = validation.data;

    console.log("[INVITE-TEAM-MEMBER] Inviting:", email, "to hotel:", hotel_id, "as:", role);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert into hotel_members with status='invited' — user_id is null until they accept
    const { error: insertError } = await supabase
      .from("hotel_members")
      .insert({
        hotel_id,
        invited_email: email.toLowerCase(),
        role,
        status: "invited",
        user_id: null,
      });

    if (insertError) {
      console.error("[INVITE-TEAM-MEMBER] Insert error:", insertError);
      // 23505 = unique violation — already invited
      if (insertError.code !== "23505") {
        return new Response(
          JSON.stringify({ error: "Failed to create invitation", success: false }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Fetch hotel name for the email
    const { data: hotel } = await supabase
      .from("hotels")
      .select("name")
      .eq("id", hotel_id)
      .maybeSingle();

    const hotelName = hotel?.name ?? "your hotel";

    // Send invite email via Supabase auth admin (generates a magic-link sign-up)
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${Deno.env.get("SITE_URL") ?? "https://vesta.ai"}/auth?hotel_invite=${hotel_id}`,
      data: { invited_hotel_id: hotel_id, invited_role: role },
    });

    if (inviteError) {
      // If user already exists Supabase returns an error — fall back to Resend
      console.warn("[INVITE-TEAM-MEMBER] inviteUserByEmail error (may be existing user):", inviteError.message);

      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const loginUrl = `${Deno.env.get("SITE_URL") ?? "https://vesta.ai"}/auth`;

      await resend.emails.send({
        from: "Vesta Team <support@vesta.ai>",
        to: [email],
        subject: `You've been invited to join ${hotelName} on Vesta`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#0f172a;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background-color:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
                <div style="background-color:#111827;padding:24px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Vesta</h1>
                  <p style="color:#94a3b8;margin:4px 0 0 0;font-size:13px;">Hotel CFO Platform</p>
                </div>
                <div style="padding:32px 28px;">
                  <h2 style="color:#f1f5f9;margin-top:0;font-size:20px;font-weight:600;">
                    You've been invited to join ${hotelName}
                  </h2>
                  <p style="color:#94a3b8;line-height:1.6;font-size:14px;">
                    Sign in to your Vesta account to accept the invitation and start collaborating.
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="${loginUrl}"
                       style="display:inline-block;background-color:#ffffff;color:#111827;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
                      Accept Invitation
                    </a>
                  </div>
                  <p style="color:#64748b;font-size:13px;">Your role: <strong style="color:#94a3b8;">${role}</strong></p>
                </div>
                <div style="background-color:#0f172a;padding:16px 28px;text-align:center;border-top:1px solid #1e293b;">
                  <p style="margin:0;color:#475569;font-size:12px;">${new Date().getFullYear()} Vesta. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[INVITE-TEAM-MEMBER] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing the invitation", success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
