import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-FOUNDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { discountCode } = await req.json();
    logStep("Discount code received", { discountCode });

    // Validate discount code
    if (!discountCode || discountCode.trim().toLowerCase() !== 'founder@vesta.ai') {
      logStep("Invalid discount code", { provided: discountCode });
      return new Response(
        JSON.stringify({ error: "Invalid discount code" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Check if user already has founder access
    const { data: existingDiscount, error: discountError } = await supabaseService
      .from('discount_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', 'founder@vesta.ai')
      .single();

    if (existingDiscount && !discountError) {
      logStep("User already has founder access");
      return new Response(
        JSON.stringify({ 
          message: "Founder access already activated",
          subscription_tier: "Founder Access"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Grant unlimited credits using the existing database function
    logStep("Granting unlimited credits");
    const { error: grantError } = await supabaseService.rpc('grant_unlimited_credits', {
      p_email: user.email
    });

    if (grantError) {
      logStep("Error granting unlimited credits", { error: grantError });
      throw new Error(`Failed to grant unlimited credits: ${grantError.message}`);
    }

    // Update subscription status in subscribers table
    logStep("Updating subscriber record");
    const { error: subscriberError } = await supabaseService
      .from('subscribers')
      .upsert({
        email: user.email,
        user_id: user.id,
        subscribed: true,
        subscription_tier: 'Founder Access',
        subscription_end: null, // Lifetime access
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'email' 
      });

    if (subscriberError) {
      logStep("Error updating subscriber record", { error: subscriberError });
      throw new Error(`Failed to update subscription: ${subscriberError.message}`);
    }

    // Update user tier to CFO (highest tier)
    logStep("Updating user tier to CFO");
    const { error: tierError } = await supabaseService.rpc('update_user_tier', {
      p_user_id: user.id,
      p_new_tier: 'ceo', // CFO tier maps to 'ceo' in the enum
      p_stripe_subscription_id: null
    });

    if (tierError) {
      logStep("Error updating user tier", { error: tierError });
      // Don't fail the whole operation if tier update fails
      console.warn("Failed to update user tier, but continuing:", tierError);
    }

    logStep("Founder access activated successfully");

    return new Response(
      JSON.stringify({ 
        message: "Founder access activated successfully!",
        subscription_tier: "Founder Access",
        benefits: {
          unlimited_credits: true,
          unlimited_downloads: true,
          unlimited_collaborators: true,
          tier: "CFO"
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in activate-founder", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});