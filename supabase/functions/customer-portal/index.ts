// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

// Helper function to get or create billing portal configuration
const getOrCreatePortalConfiguration = async (stripe: any) => {
  try {
    // List existing configurations
    const configurations = await stripe.billingPortal.configurations.list({ limit: 1 });
    
    if (configurations.data.length > 0) {
      const config = configurations.data[0];
      logStep("Using existing portal configuration", { configId: config.id });
      return config.id;
    }

    // Create new configuration if none exists
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Manage your Vesta subscription",
      },
      features: {
        payment_method_update: { enabled: true },
        subscription_cancel: { 
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features", 
              "switched_service",
              "unused",
              "other"
            ]
          }
        },
        invoice_history: { enabled: true },
      },
    });

    logStep("Created new portal configuration", { configId: configuration.id });
    return configuration.id;
  } catch (error) {
    logStep("Error with portal configuration, using default", { error: error.message });
    return undefined; // Use default configuration
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is a team member - if so, use owner's email/credits
    const { data: teamMembership } = await supabaseClient
      .from('team_members')
      .select('team_id, teams!inner(owner_id)')
      .eq('user_id', user.id)
      .neq('role', 'owner')
      .maybeSingle();

    let targetUserId = user.id;
    let targetEmail = user.email;

    if (teamMembership?.teams?.owner_id) {
      targetUserId = teamMembership.teams.owner_id;
      // Get owner's email
      const { data: ownerData } = await supabaseClient.auth.admin.getUserById(targetUserId);
      if (ownerData?.user?.email) {
        targetEmail = ownerData.user.email;
      }
      logStep("Team member - using owner's billing", { ownerId: targetUserId, ownerEmail: targetEmail });
    }

    // Check if target user has founder tier (check user_credits as source of truth)
    const { data: userCredits } = await supabaseClient
      .from("user_credits")
      .select("tier")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (userCredits && userCredits.tier === "founder") {
      logStep("Founder tier user - no Stripe customer portal needed");
      return new Response(JSON.stringify({ 
        error: "Founder Access users have lifetime access and don't need subscription management. Contact support@vesta.ai for assistance." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // For regular Stripe customers - use targetEmail (owner's email for team members)
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: targetEmail, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found for user; redirecting to pricing");
      return new Response(JSON.stringify({ url: "https://vesta.ai/pricing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get or create billing portal configuration
    const configId = await getOrCreatePortalConfiguration(stripe);
    logStep("Portal configuration ready", { configId });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://vesta.ai/dashboard",
      ...(configId && { configuration: configId }),
    });
    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});