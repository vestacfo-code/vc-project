// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Input validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000), // Prevent DoS with extremely large messages
});

const requestSchema = z.object({
  // Direct messages array format (from QuickBooksChat)
  messages: z.array(messageSchema).min(1).max(50).optional(),
  // Legacy format with message and conversationHistory
  message: z.string().min(1).max(10000).optional(),
  conversationHistory: z.array(z.object({
    type: z.enum(['user', 'assistant']),
    content: z.string().max(50000),
  })).max(50).optional(),
}).refine(
  (data) => data.messages || data.message,
  { message: "Either 'messages' or 'message' must be provided" }
);

serve(sentryServe("openai-chat", async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const rawBody = await req.json();
    
    // SECURITY: Validate input with zod schema
    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error('Input validation failed:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Invalid request format',
        details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = validationResult.data;
    
    // Handle both message formats
    let messages;
    if (requestBody.messages && Array.isArray(requestBody.messages)) {
      // Direct messages array format (from QuickBooksChat)
      messages = requestBody.messages;
    } else {
      // Legacy format with message and conversationHistory
      const { message, conversationHistory } = requestBody;
      
      messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. You can answer questions, analyze documents, and help with various tasks. Be concise but informative in your responses.'
        }
      ];

      // Add conversation history (last few messages for context)
      if (conversationHistory && Array.isArray(conversationHistory)) {
        conversationHistory.forEach((msg: any) => {
          if (msg.type === 'user') {
            messages.push({ role: 'user', content: msg.content });
          } else if (msg.type === 'assistant') {
            messages.push({ role: 'assistant', content: msg.content });
          }
        });
      }

      // Add current message
      if (message) {
        messages.push({ role: 'user', content: message });
      }
    }

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
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received');

    return new Response(JSON.stringify({ 
      response: data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));