import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// SECURITY: Input validation schema
const documentAnalysisSchema = z.object({
  documentId: z.string().uuid(),
  storagePath: z.string().min(1).max(500),
  fileType: z.string().min(1).max(100).regex(/^[a-z]+\/[a-z0-9+.-]+$/i, "Invalid MIME type"),
  enhancedMode: z.boolean().optional(),
});

// SECURITY: File size limit (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// SECURITY: Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

interface DocumentAnalysisRequest {
  documentId: string;
  storagePath: string;
  fileType: string;
  enhancedMode?: boolean;
}

serve(sentryServe("advanced-document-analysis", async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // SECURITY: Validate input
    const validationResult = documentAnalysisSchema.safeParse(rawBody);
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

    const { documentId, storagePath, fileType, enhancedMode = true } = validationResult.data;
    
    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return new Response(JSON.stringify({ 
        error: 'File type not allowed',
        allowedTypes: ALLOWED_MIME_TYPES
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Download the document from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    
    // SECURITY: Check file size
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        error: 'File too large',
        maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        actualSize: `${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`
      }), {
        status: 413, // Payload Too Large
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Detect document type from file extension or MIME type
    const documentType = detectDocumentType(storagePath, fileType);
    
    // Build analysis prompt based on document type
    const systemPrompt = buildSystemPrompt(documentType, enhancedMode);
    
    // Prepare messages for OpenAI
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Handle different file types
    if (fileType.startsWith('image/') || fileType === 'application/pdf') {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this document and extract all relevant information, especially financial data.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${fileType};base64,${base64}`
            }
          }
        ]
      });
    } else {
      // For text-based files, decode and send as text
      const textContent = new TextDecoder().decode(arrayBuffer);
      messages.push({
        role: 'user',
        content: `Analyze this ${documentType} document:\n\n${textContent}`
      });
    }

    // Call OpenAI with structured extraction
    const tools = enhancedMode ? [{
      type: "function",
      function: {
        name: "extract_financial_data",
        description: "Extract structured financial data from the document",
        parameters: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: ["invoice", "bank_statement", "financial_statement", "receipt", "contract", "report", "other"],
              description: "The type of financial document"
            },
            financialData: {
              type: "object",
              properties: {
                revenue: { type: "number", description: "Total revenue/income" },
                expenses: { 
                  type: "array", 
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      amount: { type: "number" },
                      description: { type: "string" }
                    }
                  }
                },
                dates: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Important dates in the document"
                },
                totals: {
                  type: "object",
                  properties: {
                    grandTotal: { type: "number" },
                    subtotal: { type: "number" },
                    tax: { type: "number" }
                  }
                },
                parties: {
                  type: "object",
                  properties: {
                    vendor: { type: "string" },
                    customer: { type: "string" },
                    bankName: { type: "string" }
                  }
                }
              }
            },
            summary: { type: "string", description: "A concise summary of the document (2-3 sentences)" },
            keyInsights: {
              type: "array",
              items: { type: "string" },
              description: "3-5 key insights or observations"
            },
            rawText: { type: "string", description: "Full extracted text content" },
            tables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headers: { type: "array", items: { type: "string" } },
                  rows: { type: "array" }
                }
              },
              description: "Extracted tables from the document"
            }
          },
          required: ["documentType", "summary", "rawText"]
        }
      }
    }] : undefined;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: tools ? { type: "function", function: { name: "extract_financial_data" } } : undefined,
        max_tokens: 4000,
        temperature: 0.3
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API failed: ${openAIResponse.status}`);
    }

    const aiResult = await openAIResponse.json();
    console.log('OpenAI analysis completed');

    let analysis: string;
    let structuredData: any = {};

    if (tools && aiResult.choices?.[0]?.message?.tool_calls?.[0]) {
      // Extract structured data from function call
      const functionCall = aiResult.choices[0].message.tool_calls[0];
      structuredData = JSON.parse(functionCall.function.arguments);
      
      // Create markdown analysis from structured data
      analysis = formatStructuredDataToMarkdown(structuredData);
    } else {
      // Fallback to text content
      analysis = aiResult.choices?.[0]?.message?.content || 'Analysis failed';
    }

    // Update document in database with analysis
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        markdown_content: analysis,
        structured_data: structuredData,
        document_type: structuredData.documentType || documentType,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        structuredData,
        documentType: structuredData.documentType || documentType
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in advanced-document-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}));

function detectDocumentType(filename: string, mimeType: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('invoice')) return 'invoice';
  if (lower.includes('statement') || lower.includes('bank')) return 'bank_statement';
  if (lower.includes('receipt')) return 'receipt';
  if (lower.includes('balance') || lower.includes('p&l') || lower.includes('profit')) return 'financial_statement';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('report')) return 'report';
  
  if (mimeType.includes('spreadsheet') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return 'financial_data';
  }
  
  return 'document';
}

function buildSystemPrompt(documentType: string, enhanced: boolean): string {
  const basePrompt = `You are an expert financial document analyst. Extract and structure all relevant information from the document.`;
  
  const typeSpecificPrompts: Record<string, string> = {
    invoice: `Focus on: invoice number, date, vendor, customer, line items, subtotal, tax, total amount, payment terms.`,
    bank_statement: `Focus on: account holder, bank name, statement period, transactions (date, description, amount, balance), opening/closing balance.`,
    financial_statement: `Focus on: statement type (P&L, Balance Sheet, Cash Flow), period, revenue, expenses by category, net profit/loss, assets, liabilities.`,
    receipt: `Focus on: merchant name, date, items purchased, prices, subtotal, tax, total, payment method.`,
    financial_data: `Focus on: extracting all numerical data, identifying columns/headers, recognizing patterns, calculating totals and aggregates.`,
  };
  
  const enhancedInstructions = enhanced 
    ? `\n\nProvide structured extraction using the function tool. Include insights about trends, anomalies, and business implications.`
    : '';
  
  return `${basePrompt}\n\n${typeSpecificPrompts[documentType] || 'Extract all relevant information from the document.'}${enhancedInstructions}`;
}

function formatStructuredDataToMarkdown(data: any): string {
  let markdown = `# Document Analysis\n\n`;
  
  markdown += `**Type:** ${data.documentType || 'Unknown'}\n\n`;
  
  if (data.summary) {
    markdown += `## Summary\n${data.summary}\n\n`;
  }
  
  if (data.financialData) {
    markdown += `## Financial Data\n\n`;
    
    if (data.financialData.revenue) {
      markdown += `**Revenue:** $${data.financialData.revenue.toLocaleString()}\n\n`;
    }
    
    if (data.financialData.expenses && data.financialData.expenses.length > 0) {
      markdown += `### Expenses\n`;
      data.financialData.expenses.forEach((exp: any) => {
        markdown += `- **${exp.category}**: $${exp.amount.toLocaleString()}${exp.description ? ` - ${exp.description}` : ''}\n`;
      });
      markdown += `\n`;
    }
    
    if (data.financialData.totals) {
      markdown += `### Totals\n`;
      if (data.financialData.totals.subtotal) markdown += `- Subtotal: $${data.financialData.totals.subtotal.toLocaleString()}\n`;
      if (data.financialData.totals.tax) markdown += `- Tax: $${data.financialData.totals.tax.toLocaleString()}\n`;
      if (data.financialData.totals.grandTotal) markdown += `- **Grand Total: $${data.financialData.totals.grandTotal.toLocaleString()}**\n`;
      markdown += `\n`;
    }
    
    if (data.financialData.parties) {
      markdown += `### Parties Involved\n`;
      Object.entries(data.financialData.parties).forEach(([key, value]) => {
        if (value) markdown += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
      });
      markdown += `\n`;
    }
    
    if (data.financialData.dates && data.financialData.dates.length > 0) {
      markdown += `### Important Dates\n${data.financialData.dates.map((d: string) => `- ${d}`).join('\n')}\n\n`;
    }
  }
  
  if (data.keyInsights && data.keyInsights.length > 0) {
    markdown += `## Key Insights\n${data.keyInsights.map((i: string) => `- ${i}`).join('\n')}\n\n`;
  }
  
  if (data.tables && data.tables.length > 0) {
    markdown += `## Tables\n\n`;
    data.tables.forEach((table: any, idx: number) => {
      markdown += `### Table ${idx + 1}\n`;
      if (table.headers) {
        markdown += `| ${table.headers.join(' | ')} |\n`;
        markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
      }
      if (table.rows) {
        table.rows.forEach((row: any) => {
          markdown += `| ${row.join(' | ')} |\n`;
        });
      }
      markdown += `\n`;
    });
  }
  
  if (data.rawText) {
    markdown += `## Full Text Content\n\n${data.rawText}\n`;
  }
  
  return markdown;
}
