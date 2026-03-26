import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-PRICING-STRATEGY] ${step}${detailsStr}`);
};

interface PricingStrategy {
  targetMarginPercent: number;
  competitorStrategy: 'beat-all' | 'beat-lowest' | 'match-average' | 'premium';
  minMarginFloor: number;
  customPrompt: string;
}

interface ProductData {
  id: string;
  upc: string;
  brand: string | null;
  description: string | null;
  your_price: number | null;  // Current selling price
  cogs: number | null;        // Actual cost of goods
  supplier_prices: { supplier_name: string; price: number }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const body = await req.json();
    const { products, strategy } = body as { products: ProductData[]; strategy: PricingStrategy };

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "No products provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Processing products", { count: products.length, strategy });

    // Build the prompt for the AI
    const systemPrompt = `You are an AI pricing strategist for a fragrance distribution business. Your job is to analyze product pricing data and recommend optimal selling prices.

PRICING STRATEGY SETTINGS:
- Target Margin Above COGS: ${strategy?.targetMarginPercent || 15}%
- Minimum Margin Floor: ${strategy?.minMarginFloor || 10}% (NEVER go below this margin above COGS)
- Competitor Strategy: ${strategy?.competitorStrategy || 'beat-lowest'}

COMPETITOR STRATEGY DEFINITIONS (CRITICAL - follow exactly):
${strategy?.competitorStrategy === 'beat-all' ? '• BEAT-ALL: Your recommended price must be LOWER than ALL supplier prices. Aim for 5% BELOW the lowest supplier price. The goal is to UNDERCUT everyone.' : ''}
${strategy?.competitorStrategy === 'beat-lowest' ? '• BEAT-LOWEST: Your recommended price must be LOWER than the lowest supplier price. Aim for 2% BELOW the lowest supplier. The goal is to UNDERCUT the cheapest competitor.' : ''}
${strategy?.competitorStrategy === 'match-average' ? '• MATCH-AVERAGE: Your recommended price should EQUAL the average of all supplier prices.' : ''}
${strategy?.competitorStrategy === 'premium' ? '• PREMIUM: Your recommended price should be 5% ABOVE the market average (premium positioning for higher margins).' : ''}

${strategy?.customPrompt ? `CUSTOM INSTRUCTIONS FROM USER:\n${strategy.customPrompt}\n` : ''}

CRITICAL RULES:
1. "Beat" means UNDERCUT - recommend a price LOWER than competitors to win sales
2. ONLY exception: if undercutting would violate the minimum margin floor above COGS, then use the minimum margin price instead
3. If a product has no COGS data, base the recommendation on supplier prices (undercut by the strategy percentage)
4. Return ONLY a valid JSON array with product IDs and recommended prices

OUTPUT FORMAT (strict JSON):
[
  { "id": "product-uuid", "optimalPrice": 25.99, "reasoning": "Brief 1-sentence explanation" },
  ...
]`;

    // Format product data for analysis - clearly distinguish COGS from selling price
    const productSummary = products.map(p => {
      const supplierPrices = p.supplier_prices?.map(sp => `${sp.supplier_name}: $${sp.price.toFixed(2)}`).join(', ') || 'None';
      return `- UPC: ${p.upc} | Brand: ${p.brand || 'Unknown'} | COGS: ${p.cogs ? `$${p.cogs.toFixed(2)}` : 'N/A'} | Your Current Price: ${p.your_price ? `$${p.your_price.toFixed(2)}` : 'N/A'} | Competitors: [${supplierPrices}] | ID: ${p.id}`;
    }).join('\n');

    const userPrompt = `Analyze these ${products.length} products and provide optimal pricing recommendations:

${productSummary}

Return a JSON array with optimal prices for each product. Follow the strategy settings strictly.`;

    logStep("Calling Lovable AI");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402,
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    logStep("AI response received", { contentLength: aiContent.length });

    // Parse the JSON from AI response
    let recommendations: { id: string; optimalPrice: number; reasoning?: string }[] = [];
    
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in AI response");
      }
    } catch (parseError) {
      logStep("Failed to parse AI response, using fallback calculation", { error: parseError });
      
      // Fallback to algorithmic calculation if AI response can't be parsed
      recommendations = products.map(p => {
        const supplierPrices = p.supplier_prices?.map(sp => sp.price).filter(pr => pr > 0) || [];
        const lowestSupplier = supplierPrices.length > 0 ? Math.min(...supplierPrices) : 0;
        const avgSupplier = supplierPrices.length > 0 ? supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length : 0;
        
        let optimalPrice = 0;
        let reasoning = "";
        const minMargin = strategy?.minMarginFloor || 10;
        const targetMargin = strategy?.targetMarginPercent || 15;
        
        // Use COGS for margin calculations, not selling price
        const costBasis = p.cogs && p.cogs > 0 ? p.cogs : null;
        
        if (costBasis) {
          const minPrice = costBasis * (1 + minMargin / 100);
          const targetPrice = costBasis * (1 + targetMargin / 100);
          
          // Calculate competitor-based price first
          let competitorPrice = 0;
          switch (strategy?.competitorStrategy) {
            case 'beat-all':
              competitorPrice = lowestSupplier > 0 ? lowestSupplier * 0.95 : targetPrice;
              break;
            case 'beat-lowest':
              competitorPrice = lowestSupplier > 0 ? lowestSupplier * 0.98 : targetPrice;
              break;
            case 'match-average':
              competitorPrice = avgSupplier > 0 ? avgSupplier : targetPrice;
              break;
            case 'premium':
              competitorPrice = avgSupplier > 0 ? avgSupplier * 1.05 : targetPrice;
              break;
            default:
              competitorPrice = lowestSupplier > 0 ? lowestSupplier * 0.98 : targetPrice;
          }
          
          // Apply minimum margin floor - never go below this
          if (competitorPrice < minPrice) {
            optimalPrice = minPrice;
            reasoning = `Min margin floor applied (${minMargin}%). Competitor price $${competitorPrice.toFixed(2)} would violate margin.`;
          } else {
            optimalPrice = competitorPrice;
            reasoning = `${strategy?.competitorStrategy || 'beat-lowest'} strategy applied. Margin: ${((optimalPrice - costBasis) / costBasis * 100).toFixed(1)}%`;
          }
        } else if (lowestSupplier > 0) {
          // No COGS - use competitor prices only
          switch (strategy?.competitorStrategy) {
            case 'beat-all':
              optimalPrice = lowestSupplier * 0.95;
              break;
            case 'beat-lowest':
              optimalPrice = lowestSupplier * 0.98;
              break;
            case 'match-average':
              optimalPrice = avgSupplier;
              break;
            case 'premium':
              optimalPrice = avgSupplier * 1.05;
              break;
            default:
              optimalPrice = lowestSupplier * 0.98;
          }
          reasoning = "No COGS data - based on competitor prices only";
        } else {
          optimalPrice = 0;
          reasoning = "Insufficient data for recommendation";
        }
        
        return {
          id: p.id,
          optimalPrice: Math.round(optimalPrice * 100) / 100,
          reasoning
        };
      });
    }

    // Calculate credits used (0.01 per product analyzed)
    const creditsUsed = Math.round(products.length * 0.01 * 100) / 100;
    
    logStep("Analysis complete", { 
      productsAnalyzed: products.length, 
      recommendationsGenerated: recommendations.length,
      creditsUsed 
    });

    return new Response(JSON.stringify({
      success: true,
      recommendations,
      productsAnalyzed: products.length,
      creditsUsed,
      strategy: strategy || { targetMarginPercent: 15, competitorStrategy: 'beat-lowest', minMarginFloor: 10 }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
