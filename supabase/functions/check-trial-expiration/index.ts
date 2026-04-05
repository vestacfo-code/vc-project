import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(sentryServe("check-trial-expiration", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all users with expired trials
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('user_credits')
      .select('user_id, trial_end_date, referral_code_used')
      .eq('is_trial_active', true)
      .lt('trial_end_date', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired trials:', fetchError);
      throw fetchError;
    }

    let downgradedCount = 0;

    if (expiredTrials && expiredTrials.length > 0) {
      for (const trial of expiredTrials) {
        // Downgrade to founder tier
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            is_trial_active: false,
            tier: 'founder',
            current_credits: 30,
            monthly_limit: 30,
            daily_limit: 5,
            max_monthly_downloads: 5,
            max_collaborators: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', trial.user_id);

        if (updateError) {
          console.error(`Error downgrading user ${trial.user_id}:`, updateError);
        } else {
          downgradedCount++;
          
          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: trial.user_id,
              type: 'trial_expired',
              title: 'Trial Period Ended',
              message: 'Your 14-day CFO tier trial has ended. You\'ve been moved to The Founder tier. Upgrade anytime to continue accessing premium features!',
              data: { referral_code: trial.referral_code_used }
            });
        }
      }
    }

    console.log(`Processed ${expiredTrials?.length || 0} expired trials, downgraded ${downgradedCount} users`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: expiredTrials?.length || 0,
        downgraded: downgradedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-trial-expiration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
