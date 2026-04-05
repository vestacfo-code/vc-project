// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
/**
 * hotel-ai-chat — Vesta AI Chat Edge Function
 *
 * Hotel-context-aware chat powered by GPT-4o-mini. Pulls the hotel's recent metrics,
 * expenses, revenue by channel, and open anomalies, then answers questions
 * like "Why did RevPAR drop last Tuesday?" or "What's my best channel this month?"
 *
 * Request body:
 *   { hotel_id: string, message: string, session_id?: string }
 *
 * Returns:
 *   { reply: string, session_id: string }
 */
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
  console.log(`[HOTEL-AI-CHAT] ${step}${suffix}`);
};

// ── Context builder ─────────────────────────────────────────────────────────

async function buildHotelContext(supabase: any, hotelId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    { data: hotel },
    { data: metrics },
    { data: channels },
    { data: expenses },
    { data: anomalies },
    { data: lastSummary },
  ] = await Promise.all([
    supabase.from('hotels').select('name, room_count, city, property_type, currency').eq('id', hotelId).single(),
    supabase.from('daily_metrics')
      .select('date, revpar, adr, occupancy_rate, total_revenue, labor_cost, labor_cost_ratio, gop, goppar')
      .eq('hotel_id', hotelId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false })
      .limit(30),
    supabase.from('revenue_by_channel')
      .select('date, channel, revenue, net_revenue, bookings_count, commission_rate')
      .eq('hotel_id', hotelId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false }),
    supabase.from('expenses')
      .select('date, category, amount, description')
      .eq('hotel_id', hotelId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false })
      .limit(50),
    supabase.from('anomalies')
      .select('date, metric, severity, title, description, current_value, expected_min, expected_max')
      .eq('hotel_id', hotelId)
      .eq('resolved', false)
      .order('detected_at', { ascending: false })
      .limit(10),
    supabase.from('ai_summaries')
      .select('date, headline, body, status')
      .eq('hotel_id', hotelId)
      .eq('period_type', 'daily')
      .order('date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!hotel) return 'No hotel data available.';

  const fmt = (n: number | null | undefined, d = 2) =>
    n !== null && n !== undefined && !isNaN(Number(n)) ? Number(n).toFixed(d) : 'N/A';
  const pct = (n: number | null | undefined) =>
    n !== null && n !== undefined && !isNaN(Number(n)) ? `${(Number(n) * 100).toFixed(1)}%` : 'N/A';

  // Summarize daily metrics
  const metricsSection = metrics && metrics.length > 0
    ? metrics.slice(0, 14).map(r =>
        `${r.date}: RevPAR $${fmt(r.revpar)}, ADR $${fmt(r.adr)}, Occ ${pct(r.occupancy_rate)}, Revenue $${fmt(r.total_revenue)}, Labor ${pct(r.labor_cost_ratio)}, GOP $${fmt(r.gop)}`
      ).join('\n')
    : 'No daily metrics on record.';

  // Summarize channel revenue (aggregate by channel over last 30 days)
  const channelTotals: Record<string, { revenue: number; net: number; bookings: number }> = {};
  (channels ?? []).forEach((c) => {
    if (!channelTotals[c.channel]) channelTotals[c.channel] = { revenue: 0, net: 0, bookings: 0 };
    channelTotals[c.channel].revenue += Number(c.revenue ?? 0);
    channelTotals[c.channel].net += Number(c.net_revenue ?? 0);
    channelTotals[c.channel].bookings += Number(c.bookings_count ?? 0);
  });
  const channelSection = Object.entries(channelTotals).length > 0
    ? Object.entries(channelTotals)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([ch, v]) => `${ch}: $${v.revenue.toFixed(0)} gross / $${v.net.toFixed(0)} net (${v.bookings} bookings)`)
        .join('\n')
    : 'No channel data on record.';

  // Summarize expenses by category
  const expenseTotals: Record<string, number> = {};
  (expenses ?? []).forEach((e) => {
    expenseTotals[e.category] = (expenseTotals[e.category] ?? 0) + Number(e.amount ?? 0);
  });
  const expenseSection = Object.entries(expenseTotals).length > 0
    ? Object.entries(expenseTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(0)}`)
        .join('\n')
    : 'No expense data on record.';

  // Open anomalies
  const anomalySection = anomalies && anomalies.length > 0
    ? anomalies.map(a => `[${a.severity.toUpperCase()}] ${a.title} on ${a.date}: ${a.description}`).join('\n')
    : 'No open anomalies.';

  // Last briefing
  const briefingSection = lastSummary
    ? `Date: ${lastSummary.date} | Status: ${lastSummary.status}\n${lastSummary.headline}\n${lastSummary.body}`
    : 'No recent briefing generated yet.';

  return `=== HOTEL CONTEXT ===
Property: ${hotel.name}, ${hotel.city} | ${hotel.room_count} rooms | ${hotel.property_type}
Currency: ${hotel.currency} | Data window: last 30 days ending ${today}

=== DAILY METRICS (newest first) ===
${metricsSection}

=== REVENUE BY CHANNEL (30-day totals) ===
${channelSection}

=== EXPENSES BY CATEGORY (30-day totals) ===
${expenseSection}

=== OPEN ANOMALIES ===
${anomalySection}

=== LATEST AI BRIEFING ===
${briefingSection}`;
}

// ── Message history helpers ─────────────────────────────────────────────────

async function getOrCreateSession(
  supabase: any,
  hotelId: string,
  userId: string,
  sessionId?: string,
): Promise<string> {
  if (sessionId) {
    // Verify session belongs to this user
    const { data } = await supabase
      .from('hotel_chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return sessionId;
  }

  // Create new session
  const { data: newSession } = await supabase
    .from('hotel_chat_sessions')
    .insert({ hotel_id: hotelId, user_id: userId })
    .select('id')
    .single();

  return newSession?.id;
}

async function getRecentMessages(supabase: any, sessionId: string, limit = 10): Promise<any[]> {
  const { data } = await supabase
    .from('hotel_chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).reverse(); // oldest first for GPT
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(sentryServe("hotel-ai-chat", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: { hotel_id?: string; message?: string; session_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hotel_id, message, session_id } = body;
    if (!hotel_id || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'hotel_id and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Authorization: verify hotel membership ──────────────────────────────
    const { data: membership } = await supabase
      .from('hotel_members')
      .select('role')
      .eq('hotel_id', hotel_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden: not a member of this hotel' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Session management ──────────────────────────────────────────────────
    const activeSessionId = await getOrCreateSession(supabase, hotel_id, user.id, session_id);
    if (!activeSessionId) {
      return new Response(JSON.stringify({ error: 'Failed to create chat session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build context + message history ────────────────────────────────────
    log('Building hotel context', { hotel_id });
    const [hotelContext, history] = await Promise.all([
      buildHotelContext(supabase, hotel_id),
      getRecentMessages(supabase, activeSessionId),
    ]);

    // ── Save user message ───────────────────────────────────────────────────
    await supabase.from('hotel_chat_messages').insert({
      session_id: activeSessionId,
      role: 'user',
      content: message.trim(),
    });

    // ── Call OpenAI ───────────────────────────────────────────────────────────
    const systemPrompt = `You are Vesta, an AI CFO for independent hotels. You have access to the hotel's real financial data and answer questions clearly and specifically.

Guidelines:
- Always cite specific numbers from the data when answering
- Keep answers concise — 2-4 sentences unless a detailed breakdown is requested
- If data is missing or unclear, say so rather than guessing
- For anomalies or trends, explain the likely cause and suggest an action
- Use hotel industry terminology (RevPAR, ADR, GOPPAR, occupancy) naturally
- Format currency as $X,XXX — no unnecessary decimal places

${hotelContext}`;

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    log('Calling GPT', { sessionId: activeSessionId, messageCount: messages.length });

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!gptResponse.ok) {
      const errText = await gptResponse.text();
      log('GPT error', { status: gptResponse.status, body: errText });
      return new Response(JSON.stringify({ error: `AI API error: ${gptResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gptData = await gptResponse.json();
    const reply = gptData.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';
    const tokensUsed = (gptData.usage?.prompt_tokens ?? 0) + (gptData.usage?.completion_tokens ?? 0);

    log('GPT replied', { tokensUsed, sessionId: activeSessionId });

    // ── Save assistant reply ────────────────────────────────────────────────
    await supabase.from('hotel_chat_messages').insert({
      session_id: activeSessionId,
      role: 'assistant',
      content: reply,
      metadata: { tokens_used: tokensUsed, model: gptData.model },
    });

    // ── Update session title from first message ────────────────────────────
    if (history.length === 0) {
      const title = message.trim().slice(0, 60) + (message.trim().length > 60 ? '…' : '');
      await supabase
        .from('hotel_chat_sessions')
        .update({ title })
        .eq('id', activeSessionId);
    }

    return new Response(
      JSON.stringify({ reply, session_id: activeSessionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log('Unhandled error', String(err));
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
