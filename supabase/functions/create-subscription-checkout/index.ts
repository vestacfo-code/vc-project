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
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(sentryServe("create-subscription-checkout", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { tier, isAnnual = false } = body;
    logStep("Request body parsed", { tier, isAnnual });

    if (!tier || !['scale', 'ceo'].includes(tier)) {
      throw new Error("Invalid tier specified. Must be 'scale' or 'ceo'");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get or create customer BEFORE creating checkout session
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Pricing configuration
    const pricing = {
      scale: {
        monthly: 2599, // $25.99
        annual: Math.round(2599 * 12 * 0.9), // 10% discount
        credits: 150,
        name: "Scale Tier"
      },
      ceo: {
        monthly: 3999, // $39.99
        annual: Math.round(3999 * 12 * 0.9), // 10% discount
        credits: 250,
        name: "CFO Tier"
      }
    };

    const selectedPrice = pricing[tier as keyof typeof pricing];
    const unitAmount = isAnnual ? selectedPrice.annual : selectedPrice.monthly;
    
    logStep("Pricing calculated", { tier, isAnnual, unitAmount });

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const sessionConfig: any = {
      customer: customerId,
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Vesta ${selectedPrice.name}`,
              description: tier === 'scale' 
                ? "150 credits/month, 25 downloads, 2 collaborators" 
                : "250 credits/month, unlimited downloads, 6 collaborators"
            },
            unit_amount: unitAmount,
            recurring: { interval: isAnnual ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          tier: tier,
          user_id: user.id
        }
      },
      allow_promotion_codes: true, // Allow discount codes on checkout
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      success_url: `${origin}/dashboard?upgraded=true&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-selection?upgrade_canceled=true`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}));