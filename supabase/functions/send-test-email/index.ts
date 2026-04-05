import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createResend, resendBaseSendFields } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(sentryServe("send-test-email", async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = createResend();
    if (!resend) {
      return new Response(
        JSON.stringify({
          error:
            "Email delivery is not configured. Add RESEND_API_KEY (and optionally RESEND_FROM) in Supabase Edge Function secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userEmail = user.email || "";
    console.log("[send-test-email] Sending test email to:", userEmail);

    const emailResult = await resend.emails.send({
      ...resendBaseSendFields(),
      to: [userEmail],
      subject: "✅ Vesta Test Email - It Works!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0;">🎉 Email Test Successful!</h1>
            <p style="color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Your Resend integration is working correctly.
            </p>
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="color: #7ba3e8; font-size: 14px; margin: 0;">
                Sent to: <strong style="color: #fff;">${userEmail}</strong>
              </p>
              <p style="color: #7ba3e8; font-size: 14px; margin: 8px 0 0 0;">
                Time: <strong style="color: #fff;">${new Date().toISOString()}</strong>
              </p>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
              This is a test email from the Vesta Integrations hub.
            </p>
          </div>
        </div>
      `,
    });

    console.log("[send-test-email] Result:", JSON.stringify(emailResult));

    if (emailResult.error) {
      return new Response(JSON.stringify({ error: emailResult.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, email: userEmail, id: emailResult.data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[send-test-email] Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
