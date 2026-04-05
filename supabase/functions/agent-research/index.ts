import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7,
  maxTokens = 2000
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI error:", response.status, err);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenAIStreaming(
  messages: Array<{ role: string; content: string }>,
  onDelta: (text: string) => void,
  temperature = 0.5,
  maxTokens = 4000
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI streaming error:", response.status, err);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          onDelta(content);
        }
      } catch {
        // partial JSON, ignore
      }
    }
  }

  return fullContent;
}

serve(sentryServe("agent-research", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Agent auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Authentication failed", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, userContext, pricingData } = await req.json();

    if (!message || typeof message !== "string" || message.length > 10000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context string
    let contextStr = "";
    if (userContext?.companyName) contextStr += `Company: ${userContext.companyName}. `;
    if (userContext?.industry) contextStr += `Industry: ${userContext.industry}. `;
    if (userContext?.businessProfile?.country) contextStr += `Country: ${userContext.businessProfile.country}. `;
    if (userContext?.businessProfile?.currency) contextStr += `Currency: ${userContext.businessProfile.currency}. `;

    // SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEvent(data)));
        };

        try {
          // STEP 1: PLANNER
          send({
            type: "status",
            step: 0,
            totalSteps: 1,
            label: "Planning research approach...",
            estimatedSecondsRemaining: 60,
          });

          const plannerPrompt = `You are a research planning assistant. The user wants help with the following research task:

"${message}"

${contextStr ? `Context about the user's business: ${contextStr}` : ""}

Break this down into 3-5 concrete research sub-tasks. Each sub-task should be a specific, actionable research question.

Return ONLY a JSON array of objects with "label" (short description, max 60 chars) and "prompt" (detailed research question, 1-2 sentences). Example:
[{"label": "Analyze market size", "prompt": "Research the total addressable market size for..."}]`;

          const planResponse = await callOpenAI(
            [{ role: "user", content: plannerPrompt }],
            0.3,
            1500
          );

          // Parse plan
          let steps: Array<{ label: string; prompt: string }>;
          try {
            const jsonMatch = planResponse.match(/\[[\s\S]*\]/);
            steps = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            if (!Array.isArray(steps) || steps.length === 0) {
              throw new Error("Invalid plan");
            }
            // Limit to 5 steps
            steps = steps.slice(0, 5);
          } catch {
            // Fallback: single step
            steps = [
              {
                label: "Researching your request",
                prompt: message,
              },
            ];
          }

          const totalSteps = steps.length;

          send({
            type: "status",
            step: 0,
            totalSteps,
            label: "Research plan ready",
            estimatedSecondsRemaining: totalSteps * 12,
          });

          send({
            type: "step_complete",
            step: 0,
            summary: `Planned ${totalSteps} research steps`,
          });

          // STEP 2-N: RESEARCHER
          const stepResults: string[] = [];

          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const estimatedRemaining = (totalSteps - i) * 12;

            send({
              type: "status",
              step: i + 1,
              totalSteps,
              label: step.label,
              estimatedSecondsRemaining: estimatedRemaining,
            });

            send({
              type: "thinking",
              content: `Researching: ${step.prompt}`,
            });

            const researchPrompt = `You are an expert market research analyst and business strategist. 

Research Task: ${step.prompt}

${contextStr ? `Business Context: ${contextStr}` : ""}
${pricingData?.products?.length ? `The business has ${pricingData.products.length} products in their pricing database.` : ""}

Provide detailed, actionable findings. Include specific data points, trends, and recommendations where possible. If you don't have specific real-time data, provide the best available industry knowledge and clearly state your confidence level.

Be thorough but concise. Use bullet points and structured formatting.`;

            const result = await callOpenAI(
              [{ role: "user", content: researchPrompt }],
              0.5,
              2000
            );

            stepResults.push(result);

            send({
              type: "step_complete",
              step: i + 1,
              summary: `Completed: ${step.label}`,
            });

            send({
              type: "thinking",
              content: `Completed step ${i + 1}/${totalSteps}: ${step.label}`,
            });
          }

          // FINAL: SYNTHESIZER - Stream the final report
          send({
            type: "status",
            step: totalSteps,
            totalSteps,
            label: "Synthesizing final report...",
            estimatedSecondsRemaining: 15,
          });

          const synthesisPrompt = `You are a senior business analyst creating a comprehensive research report.

Original Request: "${message}"

${contextStr ? `Business Context: ${contextStr}` : ""}

Research Findings from ${totalSteps} research steps:

${stepResults.map((r, i) => `--- Step ${i + 1}: ${steps[i].label} ---\n${r}`).join("\n\n")}

Create a well-structured, comprehensive research report that synthesizes all findings. Include:
1. Executive Summary (2-3 sentences)
2. Key Findings (organized by theme)
3. Data & Analysis (tables where appropriate)
4. Strategic Recommendations (prioritized, actionable)
5. Next Steps

Use markdown formatting with headers, bullet points, tables, and bold text for emphasis. Make it professional and actionable.`;

          await callOpenAIStreaming(
            [{ role: "user", content: synthesisPrompt }],
            (delta) => {
              send({ type: "content", delta });
            },
            0.5,
            4000
          );

          send({ type: "done" });
        } catch (error) {
          console.error("Agent research error:", error);
          send({
            type: "error",
            message: error instanceof Error ? error.message : "Research failed",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("agent-research error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
