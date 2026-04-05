import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREDIT-MANAGER] ${step}${detailsStr}`);
};

serve(sentryServe("credit-manager", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with anon key for auth operations first
    const supabaseAnonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnonClient.auth.getUser(token);
    
    if (userError || !userData?.user?.id) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ 
        error: "Authentication failed",
        details: userError?.message || "Invalid or expired token"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;

    // Now initialize service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { action, credits_used, action_type, description, target_user_id } = body;

    logStep("Request body parsed", { action, credits_used, action_type, target_user_id });

    // Determine which user's credits to access
    // For team members, they can pass target_user_id to access owner's credits
    let targetUserId = user.id;
    if (target_user_id && target_user_id !== user.id) {
      // Verify user has team access to the target user's data
      const { data: teamAccess, error: teamError } = await supabaseClient.rpc('can_access_team_data', {
        _user_id: user.id,
        _data_owner_id: target_user_id
      });
      
      if (teamError || !teamAccess) {
        logStep("Team access denied", { error: teamError?.message, targetUserId: target_user_id });
        return new Response(JSON.stringify({ 
          error: "You don't have team access to this user's credits"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
      
      targetUserId = target_user_id;
      logStep("Using team owner's credits", { targetUserId });
    }

    if (action === "use_credits") {
      // Check if user has unlimited credits first
      const { data: isUnlimited } = await supabaseClient.rpc('is_unlimited_user', {
        p_user_id: user.id
      });

      if (isUnlimited) {
        // For unlimited users, just log the usage but don't deduct credits
        const { error: logError } = await supabaseClient
          .from('credit_usage_log')
          .insert({
            user_id: user.id,
            credits_used: credits_used,
            action_type: action_type || "unlimited_user_action",
            description: description || `Unlimited user action: ${action_type}`,
            timestamp: new Date().toISOString()
          });

        if (logError) {
          logStep('Error logging unlimited user action', logError);
        }

        logStep('Unlimited user action logged', { 
          action_type, 
          credits_used,
          userId: user.id 
        });

        // Return high number for unlimited credits
        return new Response(JSON.stringify({
          success: true,
          current_credits: 999999,
          credits_used: credits_used,
          action_type: action_type,
          unlimited: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Regular credit handling for non-unlimited users
      const { data: userCredits, error: creditsError } = await supabaseClient
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (creditsError) throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
      if (!userCredits) throw new Error("User credits not found");

      logStep("Current credits fetched", userCredits);

      // Check if user has enough credits
      const canUseCredits = userCredits.current_credits >= credits_used;
      if (!canUseCredits) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Insufficient credits",
          current_credits: userCredits.current_credits,
          credits_needed: credits_used
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Deduct credits and log usage
      const { error: updateError } = await supabaseClient
        .from("user_credits")
        .update({
          current_credits: userCredits.current_credits - credits_used,
          credits_used_today: userCredits.credits_used_today + credits_used,
          credits_used_this_month: userCredits.credits_used_this_month + credits_used,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) throw new Error(`Failed to update credits: ${updateError.message}`);

      // Log the usage
      const { error: logError } = await supabaseClient
        .from("credit_usage_log")
        .insert({
          user_id: user.id,
          credits_used,
          action_type: action_type || "unknown",
          description: description || `Used ${credits_used} credits`,
          timestamp: new Date().toISOString()
        });

      if (logError) logStep("Warning: Failed to log credit usage", { error: logError.message });

      const newCredits = userCredits.current_credits - credits_used;
      logStep("Credits deducted successfully", { newCredits });

      return new Response(JSON.stringify({
        success: true,
        current_credits: newCredits,
        credits_used,
        tier: userCredits.tier
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "get_credits") {
      // Reset daily/monthly credits if needed
      await supabaseClient.rpc("reset_daily_credits");
      await supabaseClient.rpc("reset_monthly_credits");

      // Get credits for target user (could be owner's credits for team members)
      const { data: userCredits, error: creditsError } = await supabaseClient
        .from("user_credits")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (creditsError) throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
      if (!userCredits) throw new Error("User credits not found");

      // Get active add-on credits for target user
      const { data: addonCredits, error: addonError } = await supabaseClient
        .from("credit_addons")
        .select("credits_per_month")
        .eq("user_id", targetUserId)
        .eq("status", "active");

      if (addonError) {
        logStep("Warning: Failed to fetch addon credits", { error: addonError.message });
      }

      // Calculate total addon credits
      const totalAddonCredits = addonCredits?.reduce((total, addon) => total + addon.credits_per_month, 0) || 0;
      const totalMonthlyLimit = userCredits.monthly_limit + totalAddonCredits;

      logStep("Credits fetched with addons", { 
        baseCredits: userCredits.monthly_limit, 
        addonCredits: totalAddonCredits, 
        totalLimit: totalMonthlyLimit 
      });

      return new Response(JSON.stringify({
        success: true,
        ...userCredits,
        addon_credits: totalAddonCredits,
        total_monthly_limit: totalMonthlyLimit
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "add_credits") {
      const { additional_credits } = body;
      
      const { data: userCredits, error: creditsError } = await supabaseClient
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (creditsError) throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
      if (!userCredits) throw new Error("User credits not found");

      const { error: updateError } = await supabaseClient
        .from("user_credits")
        .update({
          current_credits: userCredits.current_credits + additional_credits,
          additional_credits_purchased: userCredits.additional_credits_purchased + additional_credits,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) throw new Error(`Failed to add credits: ${updateError.message}`);

      logStep("Credits added successfully", { additional_credits });

      return new Response(JSON.stringify({
        success: true,
        current_credits: userCredits.current_credits + additional_credits,
        additional_credits
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action specified");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in credit-manager", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});