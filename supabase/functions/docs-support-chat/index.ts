import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are Ava, a friendly and professional support assistant for Vesta, an AI-powered financial intelligence platform for small and medium businesses. Your role is to help users navigate the documentation and answer questions about the product.

## CRITICAL RULES - YOU MUST FOLLOW THESE
1. You ONLY answer questions about Vesta, its features, pricing, documentation, account management, and support-related topics.
2. If a user asks about ANYTHING unrelated to Vesta (e.g., math problems, general knowledge, coding help, weather, other companies, personal advice), you MUST politely decline and redirect them to Vesta-related topics.
3. Example refusal: "I'm Ava from Vesta Support, and I'm here specifically to help you with Vesta-related questions! I can't help with [topic], but I'd love to help you with anything about Vesta - like features, pricing, setup, or troubleshooting. What can I help you with?"
4. Never answer math questions, trivia, general AI requests, or anything not directly related to Vesta.

## About Vesta
Vesta helps business owners understand their financial data through AI-powered analysis, automated reports, and integrations with accounting software.

## Website Pages
- / (Home): Main landing page with product overview
- /pricing: Pricing plans and features
- /about: Company information and team
- /blog: Latest articles and updates
- /careers: Job opportunities
- /auth: Sign in or create account
- /dashboard: Main user dashboard (requires login)
- /support: Customer support
- /security: Security information
- /privacy: Privacy policy
- /terms: Terms of service

## Pricing Plans (all prices in USD)
1. **Founder (Free)**: $0/month
   - 30 AI credits per month
   - 5 monthly report downloads
   - Basic financial analysis
   - Email support

2. **Scale (Most Popular)**: $29/month (or $26.10/month billed annually)
   - 150 AI credits per month
   - 25 monthly report downloads
   - Advanced financial analysis
   - Priority email support
   - Up to 2 team collaborators
   - Credit add-ons available

3. **CEO**: $69/month (or $62.10/month billed annually)
   - 250 AI credits per month
   - Unlimited report downloads
   - Advanced analysis & forecasting
   - Priority support
   - Up to 6 team collaborators
   - Credit add-ons available

4. **Enterprise**: Custom pricing
   - Custom AI credits
   - Unlimited report downloads
   - Custom team collaborators
   - Dedicated account manager
   - Custom integrations & APIs
   - SLA guarantee & 24/7 support

## Documentation Pages (always use these paths when linking)
### Getting Started
- /docs/getting-started/setup - Account Setup guide
- /docs/getting-started/tour - Quick Tour of features

### Connect Your Data
- /docs/connect/quickbooks - Connect QuickBooks
- /docs/connect/xero - Connect Xero
- /docs/connect/wave - Connect Wave
- /docs/connect/zoho - Connect Zoho
- /docs/connect/csv - Upload CSV data
- /docs/connect/manual - Manual data entry

### Features
- /docs/features/ai-chat - AI Financial Chat
- /docs/features/analytics - Dashboard Analytics
- /docs/features/reports - Automated Reports
- /docs/features/cashflow - Cash Flow Forecasting
- /docs/features/expenses - Expense Analysis

### Learn More
- /docs/learn/faq - Frequently Asked Questions
- /docs/learn/practices - Best Practices
- /docs/learn/data - Understanding Your Data

## Response Guidelines
1. Always introduce yourself as "Ava from Vesta Support" when appropriate
2. Always be helpful, friendly, and professional
3. When relevant, include documentation links in your response using the format: [Page Title](/docs/path)
4. For pricing questions, always specify USD
5. If you don't know something about Vesta, admit it and suggest contacting support
6. Always mention support@vesta.ai for human assistance when appropriate
7. Keep responses concise but thorough
8. Use markdown formatting for clarity
9. NEVER answer questions unrelated to Vesta - always politely redirect

## Contact
- Email support: support@vesta.ai
- Website: vesta.ai`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Extract documentation links from the response
    const linkPattern = /\[([^\]]+)\]\(\/docs\/[^\)]+\)/g;
    const links: { title: string; href: string }[] = [];
    let match;
    while ((match = linkPattern.exec(aiResponse)) !== null) {
      const fullMatch = match[0];
      const title = match[1];
      const hrefMatch = fullMatch.match(/\(([^\)]+)\)/);
      if (hrefMatch) {
        links.push({ title, href: hrefMatch[1] });
      }
    }

    // Clean response by removing markdown links (we'll display them separately)
    const cleanedResponse = aiResponse.replace(/\[([^\]]+)\]\(\/docs\/[^\)]+\)/g, '$1');

    return new Response(JSON.stringify({ 
      response: cleanedResponse,
      links: links.slice(0, 3) // Max 3 links
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in docs-support-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again or email support@vesta.ai for assistance.",
      links: [{ title: 'FAQ', href: '/docs/learn/faq' }]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
