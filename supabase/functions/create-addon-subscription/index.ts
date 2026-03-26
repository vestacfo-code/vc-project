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
  console.log(`[CREATE-ADDON-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - redirecting to manage-subscription-credits");

    // This function now redirects to the new consolidated system
    const supabaseAnonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const body = await req.json();
    const { credits = 200 } = body;

    // Call the new manage-subscription-credits function
    const { data, error } = await supabaseAnonClient.functions.invoke('manage-subscription-credits', {
      body: { action: 'add', credits },
      headers: { Authorization: authHeader }
    });

    if (error) throw error;

    if (data.error) {
      if (data.error.includes("No active main subscription")) {
        // If no main subscription exists, create a checkout session for adding credits
        logStep("No main subscription found, creating checkout for credit addon");
        
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
        
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseAnonClient.auth.getUser(token);
        if (userError) throw new Error(`Authentication error: ${userError.message}`);
        const user = userData.user;
        if (!user?.email) throw new Error("User not authenticated or email not available");

        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

        // Get or create customer
        let customers = await stripe.customers.list({ email: user.email, limit: 1 });
        let customerId;
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { user_id: user.id }
          });
          customerId = customer.id;
        }

        // Calculate pricing
        const unitAmount = Math.round(credits * 0.125 * 100); // $0.125 per credit

        const session = await stripe.checkout.sessions.create({
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
                  name: `Additional Credits - ${credits} credits/month`,
                  description: `Add ${credits} extra credits to your monthly allowance for $${(unitAmount / 100).toFixed(2)}/month`
                },
                unit_amount: unitAmount,
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
          ],
          mode: "subscription",
          allow_promotion_codes: true, // Allow discount codes on checkout
          automatic_tax: {
            enabled: true,
          },
          tax_id_collection: {
            enabled: true,
          },
          billing_address_collection: 'required',
          success_url: `${req.headers.get("origin")}/dashboard?addon=success`,
          cancel_url: `${req.headers.get("origin")}/dashboard?addon=cancel`,
          metadata: {
            user_id: user.id,
            credits_per_month: credits.toString(),
            addon_type: "credits",
            subscription_type: "credits_addon"
          },
        });

        return new Response(JSON.stringify({ url: session.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      throw new Error(data.error);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Credits added to your existing subscription" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-addon-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});