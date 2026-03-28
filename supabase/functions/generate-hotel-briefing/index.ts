// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const log = (step: string, details?: any) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-HOTEL-BRIEFING] ${step}${suffix}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Parse request body ──────────────────────────────────────────────────
    let body: { hotel_id?: string; date?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hotel_id, date } = body;
    if (!hotel_id) {
      return new Response(JSON.stringify({ error: 'hotel_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetDate = date ?? new Date().toISOString().slice(0, 10);

    // ── Service-role client to bypass RLS ───────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 1. Fetch hotel info ─────────────────────────────────────────────────
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('name, room_count, city')
      .eq('id', hotel_id)
      .single();

    if (hotelError || !hotel) {
      log('Hotel fetch error', hotelError?.message);
      return new Response(JSON.stringify({ error: 'Hotel not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 2. Fetch last 7 days of metrics ─────────────────────────────────────
    const since = new Date(targetDate);
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data: metricsRows, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('date, revpar, adr, occupancy_rate, goppar')
      .eq('hotel_id', hotel_id)
      .gte('date', sinceStr)
      .order('date', { ascending: false });

    if (metricsError) {
      log('Metrics fetch error', metricsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Fetch current month budget ───────────────────────────────────────
    const targetDateObj = new Date(targetDate);
    const year = targetDateObj.getFullYear();
    const month = targetDateObj.getMonth() + 1; // 1-indexed

    const { data: budget } = await supabase
      .from('budget_targets')
      .select('*')
      .eq('hotel_id', hotel_id)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    // ── 4. Build prompt ─────────────────────────────────────────────────────
    const fmt = (n: number | null | undefined, decimals = 2) =>
      n !== null && n !== undefined && !isNaN(n) ? n.toFixed(decimals) : 'N/A';

    const metricsTable =
      metricsRows && metricsRows.length > 0
        ? metricsRows
            .map(
              (r) =>
                `  ${r.date}: RevPAR $${fmt(r.revpar)}, ADR $${fmt(r.adr)}, Occupancy ${fmt((r.occupancy_rate ?? 0) * 100, 1)}%`,
            )
            .join('\n')
        : '  No metrics available';

    const budgetSection =
      budget
        ? `Budget targets this month: RevPAR $${fmt(budget.revpar_target)}, Occupancy ${fmt((budget.occupancy_target ?? 0) * 100, 1)}%, ADR $${fmt(budget.adr_target)}`
        : '';

    const systemPrompt =
      'You are an AI CFO assistant for hotels. Write concise, data-driven daily briefings for hotel general managers. Be specific with numbers. Max 150 words for body.';

    const userPrompt = `Generate a daily briefing for ${hotel.name} (${hotel.city}, ${hotel.room_count} rooms) for ${targetDate}.

Recent metrics (last 7 days):
${metricsTable}
${budgetSection ? '\n' + budgetSection : ''}

Return JSON with exactly these fields:
{
  "headline": "one sentence summary (max 15 words)",
  "body": "2-3 paragraph briefing with specific numbers and trends",
  "status": "on_track" | "attention_needed" | "critical"
}

Rules for status:
- "on_track": metrics are within 5% of recent average
- "attention_needed": metrics are 5-20% below recent average
- "critical": metrics are >20% below recent average or no data`;

    // ── 5. Call OpenAI ──────────────────────────────────────────────────────
    let headline: string;
    let bodyText: string;
    let status: string;
    let tokensUsed = 0;
    const modelUsed = 'gpt-4o-mini';

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: modelUsed,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      log('OpenAI API error', { status: openaiResponse.status, body: errText });
      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiResponse.json();
    tokensUsed =
      (openaiData.usage?.prompt_tokens ?? 0) + (openaiData.usage?.completion_tokens ?? 0);

    // ── 6. Parse the JSON response ──────────────────────────────────────────
    let parsed: { headline: string; body: string; status: string };
    try {
      parsed = JSON.parse(openaiData.choices[0]?.message?.content ?? '{}');
    } catch (parseErr) {
      log('Failed to parse OpenAI response', String(parseErr));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    headline = parsed.headline ?? '';
    bodyText = parsed.body ?? '';
    status = parsed.status ?? 'attention_needed';

    log('AI call succeeded', { tokensUsed, status });

    // ── 7. Upsert to ai_summaries ───────────────────────────────────────────
    const metricsSnapshot = {
      metrics: metricsRows ?? [],
      budget: budget ?? null,
    };

    const { data: savedSummary, error: upsertError } = await supabase
      .from('ai_summaries')
      .upsert(
        {
          hotel_id,
          date: targetDate,
          period_type: 'daily',
          headline,
          body: bodyText,
          status,
          metrics_snapshot: metricsSnapshot,
          model: modelUsed,
          tokens_used: tokensUsed,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'hotel_id,date,period_type' },
      )
      .select()
      .single();

    if (upsertError) {
      log('ai_summaries upsert error', upsertError.message);
    }

    // ── Return result ───────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          hotel_id,
          date: targetDate,
          period_type: 'daily',
          headline,
          body: bodyText,
          status,
          model: modelUsed,
          tokens_used: tokensUsed,
          generated_at: savedSummary?.generated_at ?? new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log('Unhandled error', String(err));
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
