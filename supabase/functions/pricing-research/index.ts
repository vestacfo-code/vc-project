import { sentryServe } from "../_shared/sentry-edge.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ResearchType = 'market_overview' | 'competitor_pricing' | 'forex_impact' | 'trend_analysis' | 'brand_analysis';

interface ResearchRequest {
  researchType: ResearchType;
  context?: {
    brands?: string[];
    products?: string[];
    industry?: string;
    region?: string;
  };
}

function buildResearchPrompt(type: ResearchType, context: ResearchRequest['context']): string {
  const brands = context?.brands?.slice(0, 5).join(', ') || 'fragrance brands';
  const industry = context?.industry || 'fragrance and cosmetics wholesale';
  const region = context?.region || 'global';

  const prompts: Record<ResearchType, string> = {
    market_overview: `Provide a current market overview for the ${industry} industry. 
Focus on:
- Current market size and growth trends
- Key market drivers and challenges
- Seasonal patterns and demand cycles
- Recent industry news or developments
Context: Analysis for ${region} market, with focus on brands like ${brands}.`,

    competitor_pricing: `Analyze current wholesale pricing trends in the ${industry} market.
Focus on:
- General wholesale price ranges for premium vs. mass-market products
- Pricing patterns across different distribution channels
- Volume discount structures common in the industry
- Gray market and parallel import impact on pricing
Context: Focus on ${region} market dynamics for brands like ${brands}.`,

    forex_impact: `Analyze current foreign exchange conditions affecting ${industry} supply chains.
Focus on:
- EUR/USD exchange rate trends and outlook
- Impact on European goods imported to US
- Currency hedging considerations for importers
- Regional currency trends affecting production costs
Context: Analysis for businesses importing from Europe to ${region}.`,

    trend_analysis: `Analyze current product and consumer trends in the ${industry} market.
Focus on:
- Emerging product categories and formulations
- Consumer preference shifts
- Sustainability and clean beauty impact
- E-commerce vs. traditional retail dynamics
Context: Trends relevant to ${brands} and similar premium brands.`,

    brand_analysis: `Provide market intelligence on the following brands: ${brands}.
Focus on:
- Brand positioning and market segments
- Product line performance indicators
- Distribution channel strategies
- Recent launches or discontinuations
- Competitive landscape positioning`
  };

  return prompts[type] || prompts.market_overview;
}

Deno.serve(sentryServe("pricing-research", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { researchType, context }: ResearchRequest = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[pricing-research] User ${user.id} requesting ${researchType} research`);

    const systemPrompt = `You are a market research analyst specializing in the fragrance, cosmetics, and consumer goods wholesale industry.

CRITICAL RULES:
1. Provide factual market intelligence and general industry observations only
2. DO NOT give specific financial advice, pricing recommendations, or investment suggestions
3. DO NOT recommend specific prices or margins
4. Use general industry knowledge and publicly available market trends
5. Be specific with percentages and numbers when referencing known market data
6. Keep responses concise - 4-6 bullet points with 1-2 sentences each
7. Always end with: "Note: This is general market research only, not financial or pricing advice."

FORMAT:
- Use bullet points for clarity
- Lead with the most actionable insights
- Include relevant timeframes (e.g., "Q1 2026", "YoY")
- Mention data sources when referencing specific statistics`;

    const userPrompt = buildResearchPrompt(researchType, context);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[pricing-research] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const researchContent = data.choices?.[0]?.message?.content || 'Unable to generate research at this time.';

    console.log(`[pricing-research] Successfully generated ${researchType} research for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        researchType,
        content: researchContent,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[pricing-research] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));
