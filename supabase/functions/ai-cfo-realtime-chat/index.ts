// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const conversationMessageSchema = z.object({
  type: z.enum(['user', 'ai']),
  content: z.string().max(10000)
});

const requestSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationHistory: z.array(conversationMessageSchema).max(50).optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const body = await req.json();
    const { message, conversationHistory = [] } = requestSchema.parse(body);

    console.log('🤖 AI CFO processing message:', message);

    // Build conversation context with enhanced corporate CFO personality
    const messages = [
      {
        role: 'system',
        content: `You are Finlo's AI CFO - an elite Chief Financial Officer with 25+ years of C-suite experience.

RESPONSE STYLE:
- Be CONCISE. Match response length to question complexity.
- Simple questions get 1-3 sentence answers.
- Complex analysis gets detailed breakdowns with calculations.
- Skip preambles - just answer directly.
- ALWAYS end with "**Bottom Line:** [one sentence]"

WHEN TO BE DETAILED:
- Valuations, forecasts, analysis → Show your work
- Simple questions → Give the answer directly

Core Expertise: Business valuation, cash flow, M&A, financial modeling.

Valuation Approach (when asked):
1. SDE = Net Profit + Owner Salary + Add-backs
2. Apply industry multiple → Show math → Provide range
3. State assumptions`
      }
    ];

    // Add conversation history for context
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-10).forEach((msg: any) => {
        if (msg.type === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.type === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    console.log('🤖 Calling OpenAI Chat API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
    
    console.log('✅ AI CFO response generated');

    return new Response(JSON.stringify({ 
      response: aiResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI CFO chat function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});