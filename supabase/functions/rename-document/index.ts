// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  originalName: z.string().min(1).max(255),
  fileContent: z.string().max(100000).optional(), // Limit preview to ~100KB
  fileType: z.string().min(1).max(100),
  businessContext: z.string().max(500).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { originalName, fileContent, fileType, businessContext } = requestSchema.parse(body);

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      // Fallback to basic naming if no API key
      const timestamp = new Date().toISOString().split('T')[0];
      const baseName = originalName.split('.')[0];
      return new Response(JSON.stringify({ 
        suggestedName: `${baseName}_financial_${timestamp}.${originalName.split('.').pop()}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze content to suggest a better name
    const contentPreview = typeof fileContent === 'string' 
      ? fileContent.substring(0, 1000) 
      : 'Binary file content';

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are an AI that creates professional, descriptive filenames for business documents. 

Rules:
- Use snake_case format
- Be descriptive but concise (max 50 characters)
- Include document type/purpose
- Add date if relevant
- Keep the original file extension
- Make it professional and searchable

Examples:
- "quarterly_financial_report_q3_2024.pdf"
- "cash_flow_statement_november.xlsx"
- "expense_breakdown_marketing_2024.csv"`
          },
          {
            role: "user",
            content: `Original filename: ${originalName}
File type: ${fileType}
Business context: ${businessContext || 'General business'}
Content preview: ${contentPreview}

Suggest a professional, descriptive filename:`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let suggestedName = data.choices[0].message.content.trim();
    
    // Clean up the response and ensure it has the right extension
    suggestedName = suggestedName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const originalExtension = originalName.split('.').pop();
    
    if (!suggestedName.endsWith(`.${originalExtension}`)) {
      suggestedName = suggestedName.split('.')[0] + `.${originalExtension}`;
    }

    return new Response(JSON.stringify({ suggestedName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in rename-document function:', error);
    
    // Fallback naming
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = originalName.split('.')[0];
    const extension = originalName.split('.').pop();
    
    return new Response(JSON.stringify({ 
      suggestedName: `${baseName}_financial_${timestamp}.${extension}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});