// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Use anon client for auth operations
    const supabaseAnonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Use getUser to validate token and get user info
    const { data: userData, error: userError } = await supabaseAnonClient.auth.getUser(token);
    
    if (userError || !userData?.user) {
      logStep("Auth error, returning unsubscribed", { error: userError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    
    if (!user.id || !user.email) {
      logStep("No user ID or email found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Use service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check if user has a subscription record in Supabase (for founder access or legacy)
    const { data: existingSubscriber } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();

    // Check if this is a database-only subscription (no actual Stripe subscription)
    // We'll still verify with Stripe below to determine if there's an active Stripe sub
    const hasDbSubscription = existingSubscriber?.subscribed === true;

    // Always check Stripe to determine if there's an actual active subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // If user has a DB subscription but no Stripe customer, return db-only subscription
      if (hasDbSubscription) {
        logStep("Has database subscription but no Stripe customer - legacy/manual subscription");
        return new Response(JSON.stringify({
          subscribed: true,
          has_stripe_subscription: false,
          subscription_tier: existingSubscriber?.subscription_tier,
          subscription_end: existingSubscriber?.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // No subscription at all
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ 
        subscribed: false,
        has_stripe_subscription: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });
    const activeSub = subscriptions.data.find((s) => s.status === "active" || s.status === "trialing");
    const hasActiveSub = !!activeSub;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = activeSub!;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active or trialing subscription found", { subscriptionId: subscription.id, status: subscription.status, endDate: subscriptionEnd });
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      if (amount <= 1999) {
        subscriptionTier = "Founder Access";
      } else {
        subscriptionTier = "Full Access";
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active or trialing subscription found");
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier, hasStripe: hasActiveSub });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub || hasDbSubscription,
      has_stripe_subscription: hasActiveSub,
      subscription_tier: subscriptionTier || existingSubscriber?.subscription_tier,
      subscription_end: subscriptionEnd || existingSubscriber?.subscription_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});