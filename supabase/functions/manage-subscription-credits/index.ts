// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
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
  console.log(`[MANAGE-SUBSCRIPTION-CREDITS] ${step}${detailsStr}`);
};

serve(sentryServe("manage-subscription-credits", async (req) => {
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

    const body = await req.json();
    const { action, credits } = body;
    logStep("Request body parsed", { action, credits });

    if (!credits || credits < 100 || credits > 10000 || credits % 100 !== 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Credits must be in increments of 100, minimum 100, maximum 10,000' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    let customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Check user's tier and custom solution status
    const { data: userCredits } = await supabaseClient
      .from("user_credits")
      .select("tier, monthly_limit")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("is_custom_solution")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if user has unlimited credits (founder or custom solution with unlimited)
    const hasUnlimitedCredits = userCredits?.monthly_limit >= 999999;
    
    if (hasUnlimitedCredits) {
      logStep("User has unlimited credits - cannot add credit addons");
      return new Response(JSON.stringify({ 
        error: "You have unlimited credits and don't need credit add-ons.",
        isFounder: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Custom solution users cannot add credits through Stripe - their credits are managed by admin
    if (profile?.is_custom_solution) {
      logStep("Custom solution user - credits managed by admin");
      return new Response(JSON.stringify({ 
        error: "Your credit allocation is managed by your account administrator. Please contact support to request additional credits.",
        isCustomSolution: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Founder tier users cannot add credits
    if (userCredits?.tier === "founder") {
      logStep("Founder tier user - must upgrade first");
      return new Response(JSON.stringify({ 
        error: "Please upgrade to Scale or CFO plan first to add credit add-ons.",
        requiresSubscription: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Find the user's main subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    const mainSubscription = subscriptions.data.find(sub => 
      sub.metadata?.subscription_type !== "credits_addon"
    );

    if (!mainSubscription) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        error: "No active Stripe subscription found. Please upgrade to Scale or CFO plan first to add credits.",
        requiresSubscription: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Found main subscription", { subscriptionId: mainSubscription.id });

    // Find existing credit addon item if any
    const creditAddonItem = mainSubscription.items.data.find(item => 
      item.metadata?.item_type === "credit_addon"
    );

    if (action === "add" || action === "update") {
      // Calculate price: $0.10 per credit ($10 for 100 credits)
      const pricePerCredit = 0.10;
      const totalPrice = Math.round(credits * pricePerCredit * 100); // Convert to cents

      // Create or get price object for this credit amount
      const existingPrices = await stripe.prices.list({
        product: "credit_addon",
        active: true,
        limit: 100,
      });

      let creditPrice = existingPrices.data.find(p => p.unit_amount === totalPrice);

      if (!creditPrice) {
        // Create product if it doesn't exist
        let creditProduct;
        try {
          creditProduct = await stripe.products.retrieve("credit_addon");
        } catch {
          creditProduct = await stripe.products.create({
            id: "credit_addon",
            name: "Additional Credits",
            description: "Extra monthly credits for your plan",
          });
        }

        // Create new price
        creditPrice = await stripe.prices.create({
          product: creditProduct.id,
          unit_amount: totalPrice,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: {
            credits_per_month: credits.toString(),
            price_per_credit: pricePerCredit.toString(),
          },
        });
        logStep("Created new price", { priceId: creditPrice.id, amount: totalPrice });
      }

      if (creditAddonItem) {
        // Update existing subscription item
        await stripe.subscriptionItems.update(creditAddonItem.id, {
          price: creditPrice.id,
          metadata: {
            item_type: "credit_addon",
            credits_per_month: credits.toString(),
          },
        });
        logStep("Updated existing credit addon", { itemId: creditAddonItem.id, credits });
      } else {
        // Add new subscription item
        await stripe.subscriptionItems.create({
          subscription: mainSubscription.id,
          price: creditPrice.id,
          metadata: {
            item_type: "credit_addon",
            credits_per_month: credits.toString(),
          },
        });
        logStep("Added new credit addon", { subscriptionId: mainSubscription.id, credits });
      }

      // Update or create credit addon record in Supabase
      await supabaseClient.from('credit_addons').upsert({
        user_id: user.id,
        stripe_subscription_id: mainSubscription.id,
        credits_per_month: credits,
        monthly_cost: totalPrice,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id,stripe_subscription_id',
        ignoreDuplicates: false 
      });

    } else if (action === "remove") {
      if (creditAddonItem) {
        // Remove the credit addon subscription item
        await stripe.subscriptionItems.del(creditAddonItem.id);
        logStep("Removed credit addon", { itemId: creditAddonItem.id });

        // Mark addon as inactive in Supabase
        await supabaseClient
          .from('credit_addons')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('stripe_subscription_id', mainSubscription.id);
      }
    }

    // Get updated subscription to return current state
    const updatedSubscription = await stripe.subscriptions.retrieve(mainSubscription.id);
    const currentCreditAddon = updatedSubscription.items.data.find(item => 
      item.metadata?.item_type === "credit_addon"
    );

    const response = {
      success: true,
      subscription_id: mainSubscription.id,
      current_credit_addon: currentCreditAddon ? {
        credits: parseInt(currentCreditAddon.metadata?.credits_per_month || "0"),
        price: currentCreditAddon.price.unit_amount,
      } : null,
    };

    logStep("Operation completed successfully", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manage-subscription-credits", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}));