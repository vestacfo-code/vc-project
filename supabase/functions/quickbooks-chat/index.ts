import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(sentryServe("quickbooks-chat", async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, isNewConversation } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    let actualConversationId = conversationId;

    // Create new conversation if needed
    if (isNewConversation || !conversationId) {
      const conversationTitle = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      
      const { data: newConversation, error: createError } = await supabase
        .from('quickbooks_conversations')
        .insert({
          user_id: user.id,
          title: conversationTitle
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      actualConversationId = newConversation.id;
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('quickbooks_messages')
      .insert({
        conversation_id: actualConversationId,
        role: 'user',
        content: message
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      throw userMessageError;
    }

    // Get conversation history for context
    const { data: messageHistory, error: historyError } = await supabase
      .from('quickbooks_messages')
      .select('role, content')
      .eq('conversation_id', actualConversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching message history:', historyError);
    }

    // Get QuickBooks data for context
    const { data: qbData, error: qbError } = await supabase
      .from('quickbooks_data')
      .select('data_type, data_json')
      .eq('user_id', user.id);

    if (qbError) {
      console.error('Error fetching QB data:', qbError);
    }

    // Check if user has QuickBooks integration
    const { data: integrationData } = await supabase
      .from('quickbooks_integrations')
      .select('is_active, company_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    // Build knowledge base from QuickBooks data
    let knowledgeBase = "No QuickBooks data available.";
    let hasIntegration = false;
    
    if (qbData && qbData.length > 0) {
      hasIntegration = true;
      const dataByType: Record<string, any[]> = {};
      qbData.forEach(item => {
        if (!dataByType[item.data_type]) {
          dataByType[item.data_type] = [];
        }
        dataByType[item.data_type].push(item.data_json);
      });

      knowledgeBase = Object.entries(dataByType)
        .map(([type, items]) => `${type.toUpperCase()} (${items.length} items):\n${JSON.stringify(items, null, 2)}`)
        .join('\n\n');
    }

    // Build conversation context
    const conversationContext = messageHistory 
      ? messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    const systemPrompt = hasIntegration 
      ? `You are an expert financial analyst with access to complete QuickBooks data.

CONTEXT: You have access to the user's entire QuickBooks account data including:
${knowledgeBase}

CONVERSATION HISTORY:
${conversationContext}

CRITICAL FORMATTING RULES (YOU MUST FOLLOW EXACTLY):

1. ALWAYS start with a TL;DR in this exact format:
**TL;DR:** [2-3 sentence direct answer with key numbers]

[BLANK LINE - MANDATORY]

2. After TL;DR, add a blank line, then your analysis with clear ## headers

3. Between EVERY section, add a BLANK LINE (press enter twice in markdown)

4. For financial data, use markdown tables like this:
| Item | Amount |
|------|--------|
| Salary | $90,000 |
| Taxes | $6,885 |

[BLANK LINE after table]

5. Use bullet points with blank lines between groups:
- Point 1
- Point 2

[BLANK LINE]

- Next group point 1
- Next group point 2

6. ALWAYS end with this exact format:
[BLANK LINE]
## Summary & Next Steps

1. [Specific actionable item with numbers]
2. [Specific actionable item with numbers]
3. [Specific actionable item with numbers]

EXAMPLE STRUCTURE (follow this spacing exactly):
**TL;DR:** A $90k technician will cost ~$111k/year total. They need to generate $9,250/month to break even.

## True Cost Breakdown

| Cost Item | Annual Amount |
|-----------|---------------|
| Salary | $90,000 |
| Taxes & Benefits | $21,000 |
| **Total** | **$111,000** |

## ROI Analysis

Your current revenue is $10,134 with thin margins. This hire needs to add significant value.

⚠️ **Risk:** Current profit margin is only 5.6%. A new hire increases fixed costs substantially.

## Summary & Next Steps

1. Secure 3+ new contracts worth $15k+ before hiring
2. Focus on collecting the $8,338 in unpaid invoices first
3. Consider starting with a part-time contractor to test demand

CONTENT INSTRUCTIONS:
- Analyze the user's financial data to provide specific, actionable insights
- Reference actual numbers from their QuickBooks data
- Be specific about customers, vendors, accounts, and patterns
- Identify risks with ⚠️ and positives with ✅
- Keep tone professional but conversational
- Every sentence must add value - be concise`
      : `You are a helpful AI financial assistant. However, the user has not yet connected their QuickBooks account.

CONVERSATION HISTORY:
${conversationContext}

IMPORTANT INSTRUCTIONS:
- When the user asks about their financial data, politely guide them to connect their accounting platform first
- Explain: "I'd love to help analyze your financial data! To get started, please click the menu icon (⋯) in the top-left sidebar under 'Connected Account' and select your accounting platform (QuickBooks, Xero, etc.) to connect."
- Be friendly and encouraging
- Explain that once connected, you'll have access to their real-time financial data, revenue tracking, expense analysis, and can provide AI-powered insights
- For general financial questions not requiring their data, provide helpful generic advice`;

    // Call OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const aiResponse = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiResponse);
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const assistantMessage = aiResponse.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

    // Save assistant message
    const { error: assistantMessageError } = await supabase
      .from('quickbooks_messages')
      .insert({
        conversation_id: actualConversationId,
        role: 'assistant',
        content: assistantMessage
      });

    if (assistantMessageError) {
      console.error('Error saving assistant message:', assistantMessageError);
      throw assistantMessageError;
    }

    // Update conversation timestamp
    await supabase
      .from('quickbooks_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', actualConversationId);

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      conversationId: actualConversationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in quickbooks-chat function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});