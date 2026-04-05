import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(sentryServe("generate-initial-referral-codes", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { count } = await req.json();
    const generateCount = count || 10;

    const codes: string[] = [];

    // Generate codes
    for (let i = 0; i < generateCount; i++) {
      const { data, error } = await supabase
        .rpc('generate_referral_code');

      if (error) {
        console.error('Error generating code:', error);
        continue;
      }

      if (data) {
        // Insert the generated code
        const { error: insertError } = await supabase
          .from('referral_codes')
          .insert({
            code: data,
            created_by_user_id: null // System-generated
          });

        if (!insertError) {
          codes.push(data);
        }
      }
    }

    console.log(`Generated ${codes.length} initial referral codes`);

    return new Response(
      JSON.stringify({ 
        success: true,
        codes,
        count: codes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-initial-referral-codes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
