// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ADDON-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Initialize Supabase clients
    const supabaseAnonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnonClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get all existing add-on records for this user
    const { data: existingAddons, error: addonError } = await supabaseClient
      .from('credit_addons')
      .select('*')
      .eq('user_id', user.id);

    if (addonError) {
      logStep("Error fetching existing addons", addonError);
      throw new Error(`Failed to fetch existing addons: ${addonError.message}`);
    }

    logStep("Found existing addons", { count: existingAddons?.length || 0 });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      // Update all addons to inactive if no customer exists
      if (existingAddons && existingAddons.length > 0) {
        await supabaseClient
          .from('credit_addons')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
      return new Response(JSON.stringify({ addons: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100, // Get all active subscriptions
    });

    logStep("Found active subscriptions", { count: subscriptions.data.length });

    const activeAddons = [];

    // Process each subscription to see if it's a credit addon
    for (const subscription of subscriptions.data) {
      const metadata = subscription.metadata;
      if (metadata.addon_type === "credits" && metadata.user_id === user.id) {
        const creditsPerMonth = parseInt(metadata.credits_per_month) || 200;
        
        // Check if we have a record for this subscription
        const existingAddon = existingAddons?.find(addon => addon.stripe_subscription_id === subscription.id);
        
        if (existingAddon) {
          // Update existing record
          await supabaseClient
            .from('credit_addons')
            .update({
              status: 'active',
              credits_per_month: creditsPerMonth,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);
          
          activeAddons.push({
            id: existingAddon.id,
            credits_per_month: creditsPerMonth,
            monthly_cost: existingAddon.monthly_cost,
            stripe_subscription_id: subscription.id,
            status: 'active'
          });
        } else {
          // Create new record
          const { data: newAddon, error: insertError } = await supabaseClient
            .from('credit_addons')
            .insert({
              user_id: user.id,
              stripe_subscription_id: subscription.id,
              credits_per_month: creditsPerMonth,
              monthly_cost: Math.round((creditsPerMonth / 200) * 2500), // Calculate cost
              status: 'active'
            })
            .select()
            .single();

          if (insertError) {
            logStep("Error inserting new addon", insertError);
          } else if (newAddon) {
            activeAddons.push(newAddon);
          }
        }
      }
    }

    // Mark any addons as inactive if they don't have active subscriptions
    const activeSubscriptionIds = subscriptions.data.map(sub => sub.id);
    const inactiveAddons = existingAddons?.filter(addon => 
      addon.stripe_subscription_id && !activeSubscriptionIds.includes(addon.stripe_subscription_id)
    ) || [];

    for (const inactiveAddon of inactiveAddons) {
      await supabaseClient
        .from('credit_addons')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', inactiveAddon.id);
    }

    logStep("Processed addon subscriptions", { activeCount: activeAddons.length, inactiveCount: inactiveAddons.length });

    return new Response(JSON.stringify({ addons: activeAddons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-addon-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});