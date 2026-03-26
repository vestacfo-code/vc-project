import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Simple rate limiter
const rateLimiter = new Map<string, number[]>();
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  const recent = requests.filter(t => now - t < 60000);
  if (recent.length >= 20) {
    return { allowed: false, retryAfter: Math.ceil((Math.min(...recent) + 60000 - now) / 1000) };
  }
  recent.push(now);
  rateLimiter.set(ip, recent);
  return { allowed: true };
}

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Retry-After': limit.retryAfter?.toString() || '60' },
    });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    
    // SECURITY: Webhook secret is MANDATORY to prevent fake events
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured - webhook rejected");
      return new Response(JSON.stringify({ 
        error: "Webhook secret not configured. This endpoint requires signature verification." 
      }), {
        status: 503, // Service Unavailable
      });
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      logStep("ERROR: No stripe-signature header found");
      throw new Error("No stripe-signature header found");
    }

    const body = await req.text();
    let event: Stripe.Event;

    // SECURITY: Always verify webhook signature - no fallback
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified successfully");
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400,
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different webhook events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription event", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer
        });

        // Get user_id from subscription metadata
        const userId = subscription.metadata?.user_id;
        if (!userId) {
          logStep("WARNING: No user_id in subscription metadata");
          break;
        }

        // Determine tier from subscription items
        let tier: 'founder' | 'scale' | 'ceo' = 'founder';
        let isAddon = false;
        let addonCredits = 0;

        for (const item of subscription.items.data) {
          const amount = item.price.unit_amount || 0;
          const metadata = subscription.metadata || {};

          // Check if this is an addon subscription
          if (metadata.subscription_type === 'credits_addon' || metadata.addon_type === 'credits') {
            isAddon = true;
            addonCredits = parseInt(metadata.credits_per_month || '0');
            logStep("Detected addon subscription", { credits: addonCredits });
            break;
          }

          // Determine main subscription tier
          if (amount >= 3500 && amount <= 4500) {
            tier = 'ceo';
          } else if (amount >= 2000 && amount <= 3000) {
            tier = 'scale';
          } else if (amount >= 20000 && amount <= 50000) {
            // Annual pricing (with discounts)
            if (amount >= 40000) tier = 'ceo';
            else tier = 'scale';
          }
        }

        if (isAddon) {
          // Handle addon subscription
          const { error: addonError } = await supabaseAdmin
            .from('credit_addons')
            .upsert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              credits_per_month: addonCredits,
              monthly_cost: (subscription.items.data[0]?.price.unit_amount || 0),
              status: subscription.status === 'active' ? 'active' : 'inactive',
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: 'stripe_subscription_id'
            });

          if (addonError) {
            logStep("ERROR: Failed to upsert addon", { error: addonError.message });
          } else {
            logStep("Addon subscription updated successfully");
          }
        } else {
          // Handle main subscription - update user_credits
          const { error: updateError } = await supabaseAdmin.rpc('update_user_tier', {
            p_user_id: userId,
            p_new_tier: tier,
            p_stripe_subscription_id: subscription.id
          });

          if (updateError) {
            logStep("ERROR: Failed to update user tier", { error: updateError.message });
          } else {
            logStep("User tier updated successfully", { tier });
            
            // Send subscription welcome email
            try {
              const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('email, full_name')
                .eq('user_id', userId)
                .single();
              
              if (profile?.email) {
                const tierDisplay = tier === 'ceo' ? 'CFO' : tier === 'scale' ? 'Scale' : 'Founder';
                const tierCredits = tier === 'ceo' ? 250 : tier === 'scale' ? 150 : 30;
                const firstName = profile.full_name?.split(' ')[0] || 'there';
                
                await resend.emails.send({
                  from: 'Finlo <support@joinfinlo.ai>',
                  to: [profile.email],
                  subject: `Welcome to Finlo ${tierDisplay}! 🚀`,
                  html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0;">Welcome to ${tierDisplay}, ${firstName}! 🎉</h1>
                        <p style="color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                          You now have access to <strong style="color: #7ba3e8;">${tierCredits} AI credits</strong> per month and all the powerful features of the ${tierDisplay} plan.
                        </p>
                        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
                          <h3 style="color: #7ba3e8; font-size: 18px; margin: 0 0 16px 0;">Your ${tierDisplay} Benefits:</h3>
                          <ul style="color: #e2e8f0; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                            <li><strong>${tierCredits} AI credits</strong> per month</li>
                            <li>Unlimited document uploads</li>
                            <li>AI-powered financial insights</li>
                            <li>Priority support</li>
                          </ul>
                        </div>
                        <a href="https://joinfinlo.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7ba3e8 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
                          Go to Dashboard →
                        </a>
                      </div>
                    </div>
                  `,
                });
                logStep("Subscription welcome email sent", { email: profile.email, tier });
              }
            } catch (emailError) {
              logStep("WARNING: Failed to send subscription email", { error: emailError.message });
            }
          }

          // Update subscribers table
          const { error: subError } = await supabaseAdmin
            .from('subscribers')
            .upsert({
              user_id: userId,
              email: (event.data.object as any).customer_email || '',
              subscription_tier: tier === 'ceo' ? 'CFO' : tier === 'scale' ? 'Scale' : 'Founder Access',
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (subError) {
            logStep("ERROR: Failed to update subscribers", { error: subError.message });
          }
           
           // Also set credit_renewal_day for the user profile
           const renewalDay = new Date(subscription.current_period_end * 1000).getDate();
           const { error: profileError } = await supabaseAdmin
             .from('profiles')
             .update({ credit_renewal_day: renewalDay })
             .eq('user_id', userId);
           
           if (profileError) {
             logStep("WARNING: Failed to update credit_renewal_day", { error: profileError.message });
           }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        
        if (!userId) {
          logStep("WARNING: No user_id in deleted subscription metadata");
          break;
        }

        logStep("Processing subscription deletion", { subscriptionId: subscription.id });

        // Check if this is an addon
        if (subscription.metadata?.subscription_type === 'credits_addon') {
          // Deactivate addon
          const { error } = await supabaseAdmin
            .from('credit_addons')
            .update({ status: 'cancelled' })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            logStep("ERROR: Failed to deactivate addon", { error: error.message });
          } else {
            logStep("Addon deactivated successfully");
          }
        } else {
          // Downgrade to founder tier
          const { error } = await supabaseAdmin.rpc('update_user_tier', {
            p_user_id: userId,
            p_new_tier: 'founder',
            p_stripe_subscription_id: null
          });

          if (error) {
            logStep("ERROR: Failed to downgrade to founder", { error: error.message });
          } else {
            logStep("User downgraded to founder successfully");
          }

          // Update subscribers table
          await supabaseAdmin
            .from('subscribers')
            .update({
              subscription_status: 'cancelled',
              subscription_tier: 'Founder Access'
            })
            .eq('user_id', userId);
        }

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        // Check if this is a custom solution checkout
        const isCustomSolution = session.metadata?.is_custom_solution === 'true';
        const userId = session.metadata?.user_id;
        const inviteId = session.metadata?.invite_id;

        if (isCustomSolution && userId && inviteId) {
          logStep("Processing custom solution payment", { userId, inviteId });

          const fixedAmount = parseFloat(session.metadata?.fixed_amount || '0');
          const monthlyAmount = parseFloat(session.metadata?.monthly_amount || '0');
          const features = session.metadata?.features ? JSON.parse(session.metadata.features) : [];
          const monthlyCredits = session.metadata?.monthly_credits ? parseInt(session.metadata.monthly_credits) : null;

          // Create custom_pricing record
          const { error: pricingError } = await supabaseAdmin
            .from('custom_pricing')
            .insert({
              user_id: userId,
              fixed_amount: fixedAmount,
              monthly_amount: monthlyAmount,
              description: 'Custom solution pricing',
              is_active: true,
              created_by: userId,
            });

          if (pricingError) {
            logStep("ERROR: Failed to create custom pricing", { error: pricingError.message });
          }

          // Update invite to used status
          const { error: inviteError } = await supabaseAdmin
            .from('consumer_invite_links')
            .update({ status: 'used' })
            .eq('id', inviteId);

          if (inviteError) {
            logStep("ERROR: Failed to update invite status", { error: inviteError.message });
          }

          // Update profile payment status to completed
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ payment_status: 'completed' })
            .eq('user_id', userId);

          if (profileError) {
            logStep("ERROR: Failed to update profile payment status", { error: profileError.message });
          }

          // Apply custom credits if specified
          if (monthlyCredits !== null) {
            const creditsValue = monthlyCredits === -1 ? 999999 : monthlyCredits;
            const dailyLimit = creditsValue === 999999 ? 999999 : Math.ceil(creditsValue / 5);

            const { error: creditsError } = await supabaseAdmin
              .from('user_credits')
              .update({
                monthly_limit: creditsValue,
                current_credits: creditsValue,
                daily_limit: dailyLimit,
                 last_reset_date: new Date().toISOString().split('T')[0],
              })
              .eq('user_id', userId);

            if (creditsError) {
              logStep("ERROR: Failed to apply custom credits", { error: creditsError.message });
            } else {
              logStep("Applied custom credits", { monthlyCredits, creditsValue });
            }
          }
           
           // Set credit_renewal_day for custom solution users
           const renewalDay = new Date().getDate();
           await supabaseAdmin
             .from('profiles')
             .update({ 
               credit_renewal_day: renewalDay,
               payment_status: 'completed'
             })
             .eq('user_id', userId);

          // Ensure features are enabled (they should already be, but double-check)
          if (features.length > 0) {
            for (const featureKey of features) {
              await supabaseAdmin
                .from('consumer_features')
                .upsert({
                  user_id: userId,
                  feature_key: featureKey,
                  enabled: true,
                  enabled_at: new Date().toISOString(),
                }, { onConflict: 'user_id,feature_key' });
            }
          }

          logStep("Custom solution payment processed successfully");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id });
        
        // Payment succeeded - subscription is active and renewed
        // Credits should be reset by the monthly reset function
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        
        // Optionally notify user or handle failed payment
        const customerId = invoice.customer as string;
        if (customerId) {
          // Could send notification here
          logStep("TODO: Notify user of payment failure", { customerId });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook handler", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
