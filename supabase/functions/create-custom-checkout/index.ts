import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CUSTOM-CHECKOUT] ${step}${detailsStr}`);
};

serve(sentryServe("create-custom-checkout", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const { 
      inviteId, 
      fixedAmount = 0, 
      monthlyAmount = 0, 
      email, 
      features = [],
      monthlyCredits = null,
      successUrl,
      cancelUrl 
    } = await req.json();

    logStep("Creating custom checkout", { 
      inviteId, 
      fixedAmount, 
      monthlyAmount, 
      email,
      monthlyCredits,
      userId: user.id 
    });

    if (!inviteId) {
      throw new Error('Invite ID is required');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          user_id: user.id,
          invite_id: inviteId,
          is_custom_solution: 'true'
        }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'payment';

    // Add monthly subscription if applicable
    if (monthlyAmount > 0) {
      mode = 'subscription';
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Custom Solution - Monthly',
            description: 'Monthly subscription for your custom Vesta solution',
          },
          unit_amount: Math.round(monthlyAmount * 100), // Convert to cents
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      });
    }

    // Add one-time setup fee if applicable
    if (fixedAmount > 0) {
      if (monthlyAmount > 0) {
        // When there's both, add the setup fee as a one-time invoice item
        // For subscription mode, we need to use a different approach
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Setup Fee',
              description: 'One-time setup fee for your custom solution',
            },
            unit_amount: Math.round(fixedAmount * 100), // Convert to cents
          },
          quantity: 1
        });
      } else {
        // Only setup fee, no monthly
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Custom Solution - Setup Fee',
              description: 'One-time setup fee for your custom Vesta solution',
            },
            unit_amount: Math.round(fixedAmount * 100),
          },
          quantity: 1
        });
      }
    }

    if (lineItems.length === 0) {
      throw new Error('No pricing configured - at least one fee is required');
    }

    // Build session create params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `${req.headers.get('origin')}/chat?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/join/${inviteId}?payment=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        invite_id: inviteId,
        is_custom_solution: 'true',
        features: JSON.stringify(features),
        fixed_amount: fixedAmount.toString(),
        monthly_amount: monthlyAmount.toString(),
        monthly_credits: monthlyCredits !== null ? monthlyCredits.toString() : ''
      }
    };

    // Add subscription_data metadata if it's a subscription
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
          invite_id: inviteId,
          is_custom_solution: 'true',
          features: JSON.stringify(features),
          monthly_credits: monthlyCredits !== null ? monthlyCredits.toString() : ''
        }
      };
    }

    logStep("Creating checkout session", { mode, lineItemsCount: lineItems.length });

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id });

    // Update invite status to pending_payment
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin
      .from('consumer_invite_links')
      .update({ status: 'pending_payment' })
      .eq('id', inviteId);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
}));
