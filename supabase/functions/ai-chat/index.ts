// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Updated schema - removed userId as we'll use authenticated user
const requestSchema = z.object({
  message: z.string().min(1).max(5000),
  documentContext: z.any().optional(),
  financialContext: z.any().optional(),
  userProfile: z.object({
    company: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
  instructions: z.string().optional(),
  authoritativeContext: z.string().optional(),
});

serve(sentryServe("ai-chat", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Get and validate auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AI-CHAT] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Create client with user's auth context using anon key
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // SECURITY: Verify the user's authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[AI-CHAT] Invalid authentication:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = user.id;
    console.log('[AI-CHAT] Authenticated user:', authenticatedUserId);

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ response: 'Invalid request format. Please check your input.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, documentContext, financialContext, userProfile, instructions, authoritativeContext } = validation.data;

    // Use service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SECURITY: Check user credits before processing
    const { data: credits } = await supabase
      .from('user_credits')
      .select('current_credits, daily_limit, credits_used_today')
      .eq('user_id', authenticatedUserId)
      .single();

    if (!credits || credits.current_credits <= 0) {
      console.log('[AI-CHAT] User out of credits:', authenticatedUserId);
      return new Response(
        JSON.stringify({ error: 'No credits available. Please upgrade your plan or wait for your credits to reset.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (credits.credits_used_today >= credits.daily_limit) {
      console.log('[AI-CHAT] User exceeded daily limit:', authenticatedUserId);
      return new Response(
        JSON.stringify({ error: 'Daily credit limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    let financialData = {};
    if (financialContext) {
      try {
        financialData = typeof financialContext === 'string' ? JSON.parse(financialContext) : financialContext;
      } catch (e) {
        console.warn('Failed to parse financial context:', e);
      }
    }

    let systemContext = `You are Vesta's AI CFO - a seasoned Chief Financial Officer with 25+ years of corporate finance experience. You provide DIRECT, actionable financial guidance.

CRITICAL RULES:
1. SHOW YOUR WORK - include calculations and step-by-step math when relevant
2. When asked to valuate, analyze, or project - DO IT with real numbers, don't just explain concepts
3. Make reasonable assumptions based on the business's industry when data is missing, and STATE those assumptions
4. Be DIRECT - give concrete answers, not hedged maybes
5. ALWAYS end every response with ONE bold summary sentence using a VARIED intro phrase. Choose naturally from: "**In short:**", "**The takeaway:**", "**Key point:**", "**Here's the deal:**", "**My recommendation:**", "**What matters:**", or "**TL;DR:**" - pick whichever fits the context best. NEVER use "Bottom Line:" as it has become repetitive.

When Valuating a Business:
- Use SDE multiple method for small businesses (1.5-4x SDE typical)
- Calculate: SDE = Net Profit + Owner Salary + Discretionary Add-backs
- Apply industry-appropriate multiples and explain why
- Show the math clearly
- Provide a range (low/mid/high)`;

    if (userProfile) {
      systemContext += `\n\nUser's Business: ${userProfile.company || 'Not specified'} in ${userProfile.industry || 'general'} industry`;
    }

    if (instructions) {
      systemContext += `\n\nINSTRUCTIONS (STRICTLY FOLLOW): ${instructions}`;
    }

    if (financialData && Object.keys(financialData).length > 0) {
      systemContext += `\n\nCurrent Financial Data (Authoritative):\n- Revenue: $${financialData.revenue?.toLocaleString() || 0}\n- Expenses: $${financialData.expenses?.toLocaleString() || 0}\n- Profit: $${financialData.profit?.toLocaleString() || 0}\n- Cash Flow: $${financialData.cashFlow?.toLocaleString() || 0}\n- Health Score: ${financialData.healthScore || 'N/A'}/100`;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemContext },
          ...(authoritativeContext ? [{ role: 'system', content: `Authoritative Context: ${authoritativeContext}` }] : []),
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('[AI-CHAT] API error:', { status: response.status, userId: authenticatedUserId });
      
      // Handle rate limiting gracefully
      if (response.status === 429) {
        console.log('[AI-CHAT] Rate limit hit');
        
        const fallbackResponse = `I'm currently experiencing high demand. Let me provide some general guidance based on your financial data:

**Your Financial Overview:**
- Revenue: $${financialData?.revenue?.toLocaleString() || 'N/A'}
- Expenses: $${financialData?.expenses?.toLocaleString() || 'N/A'}  
- Profit: $${financialData?.profit?.toLocaleString() || 'N/A'}
- Cash Flow: $${financialData?.cashFlow?.toLocaleString() || 'N/A'}

**Your Question:** "${message}"

**General Recommendations:**
1. **Cash Flow Management**: Monitor your cash flow closely and maintain 3-6 months of expenses as reserves
2. **Expense Optimization**: Review recurring expenses quarterly to identify cost-saving opportunities
3. **Profit Reinvestment**: Consider reinvesting 15-20% of profits into growth initiatives
4. **Financial Tracking**: Use consistent financial reporting to track key metrics monthly

Please try your question again in a few minutes for a more personalized analysis.`;

        return new Response(JSON.stringify({ response: fallbackResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle other API errors with generic message
      const errorResponse = `I apologize, but I'm temporarily unable to process your request. Please try again in a moment, or feel free to rephrase your question.`;

      return new Response(JSON.stringify({ response: errorResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    
    if (!aiResult.choices || !aiResult.choices[0] || !aiResult.choices[0].message) {
      console.error('[AI-CHAT] Invalid response structure');
      
      const fallbackResponse = `I'm having trouble processing your request right now. Please try again or rephrase your question.`;

      return new Response(JSON.stringify({ response: fallbackResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const aiResponse = aiResult.choices[0].message.content;

    // SECURITY: Log AI usage for auditing
    await supabase
      .from('ai_interaction_log')
      .insert({
        user_id: authenticatedUserId,
        interaction_type: 'ai_chat',
        model_used: 'llama-3.3-70b-versatile',
        tokens_used: aiResult.usage?.total_tokens || 0,
        metadata: { message_length: message.length }
      });

    console.log('[AI-CHAT] Successfully processed request for user:', authenticatedUserId);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AI-CHAT] Unexpected error:', error);
    
    const fallbackResponse = `I'm experiencing technical difficulties. Please try your question again in a moment.`;

    return new Response(JSON.stringify({ 
      response: fallbackResponse
    }), {
      status: 200, // Return 200 so the frontend gets the fallback response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));
