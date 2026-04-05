// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(sentryServe("check-subscription", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
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
    const { data: existingSubscriber, error: subscriberSelectError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (subscriberSelectError) {
      logStep("subscribers select warning", { message: subscriberSelectError.message });
    }

    // Check if this is a database-only subscription (no actual Stripe subscription)
    // We'll still verify with Stripe below to determine if there's an active Stripe sub
    const hasDbSubscription = existingSubscriber?.subscribed === true;

    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not set — returning DB-only / unsubscribed (no 500)");
      return new Response(
        JSON.stringify({
          subscribed: hasDbSubscription,
          has_stripe_subscription: false,
          subscription_tier: existingSubscriber?.subscription_tier ?? null,
          subscription_end: existingSubscriber?.subscription_end ?? null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });

      if (customers.data.length === 0) {
        logStep("No Stripe customer found");

        if (hasDbSubscription) {
          logStep("Has database subscription but no Stripe customer - legacy/manual subscription");
          return new Response(
            JSON.stringify({
              subscribed: true,
              has_stripe_subscription: false,
              subscription_tier: existingSubscriber?.subscription_tier,
              subscription_end: existingSubscriber?.subscription_end,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            },
          );
        }

        await supabaseClient.from("subscribers").upsert(
          {
            email: user.email,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: false,
            subscription_tier: null,
            subscription_end: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
        return new Response(JSON.stringify({ subscribed: false, has_stripe_subscription: false }), {
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
        const subscription = activeSub;
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Active or trialing subscription found", {
          subscriptionId: subscription.id,
          status: subscription.status,
          endDate: subscriptionEnd,
        });
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        subscriptionTier = amount <= 1999 ? "Founder Access" : "Full Access";
        logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
      } else {
        logStep("No active or trialing subscription found");
      }

      await supabaseClient.from("subscribers").upsert(
        {
          email: user.email,
          user_id: user.id,
          stripe_customer_id: customerId,
          subscribed: hasActiveSub,
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

      logStep("Updated database with subscription info", {
        subscribed: hasActiveSub,
        subscriptionTier,
        hasStripe: hasActiveSub,
      });
      return new Response(
        JSON.stringify({
          subscribed: hasActiveSub || hasDbSubscription,
          has_stripe_subscription: hasActiveSub,
          subscription_tier: subscriptionTier || existingSubscriber?.subscription_tier,
          subscription_end: subscriptionEnd || existingSubscriber?.subscription_end,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } catch (billingErr) {
      const msg = billingErr instanceof Error ? billingErr.message : String(billingErr);
      logStep("Stripe billing path failed (non-fatal)", { message: msg });
      return new Response(
        JSON.stringify({
          subscribed: hasDbSubscription,
          has_stripe_subscription: false,
          subscription_tier: existingSubscriber?.subscription_tier ?? null,
          subscription_end: existingSubscriber?.subscription_end ?? null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}));