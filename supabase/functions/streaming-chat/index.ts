import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// SECURITY: Input validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
});

const documentContextSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().regex(/^[a-z]+\/[a-z0-9+.-]+$/i, "Invalid MIME type"),
  analysis: z.string().optional(),
  markdown: z.string().optional(),
  storagePath: z.string().min(1).max(500),
  id: z.string().uuid().optional(),
});

const userContextSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  companySize: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  businessProfile: z.object({
    legalName: z.string().nullable().optional(),
    tradeName: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    industryNaics: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    employees: z.number().nullable().optional(),
    owners: z.number().nullable().optional(),
  }).nullable().optional(),
}).nullable().optional();

const pricingDataSchema = z.object({
  products: z.array(z.object({
    upc: z.string(),
    brand: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    productType: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    baseCost: z.number().nullable().optional(),
    cogs: z.number().nullable().optional(),
    targetMargin: z.number().nullable().optional(),
    supplierPrices: z.array(z.object({
      supplierName: z.string(),
      price: z.number(),
      country: z.string().nullable().optional(),
      availability: z.number().nullable().optional(),
      minOrderQty: z.number().nullable().optional(),
    })).optional(),
    aiRecommendation: z.object({
      optimalPrice: z.number(),
      reasoning: z.string().nullable().optional(),
    }).optional(),
  })).optional(),
  suppliers: z.array(z.object({
    name: z.string(),
    country: z.string().nullable().optional(),
    currency: z.string(),
  })).optional(),
}).optional();

// Allowed models whitelist
const ALLOWED_MODELS: Record<string, string> = {
  'auto': 'auto', // Will be resolved dynamically based on intent
  'gpt-4o': 'gpt-4o',
  'gpt-4o-search': 'gpt-4o',
  'o3-mini': 'o3-mini',
  'deep-research': 'o3-deep-research',
  'gpt-5': 'gpt-5',
};

// Intent-based model routing for "auto" mode
function detectBestModel(messages: Array<{ role: string; content: string }>): { modelId: string; useWebSearch: boolean } {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
  const allUserContent = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');
  
  // Patterns that need real-time / internet data
  const webSearchPatterns = [
    /\b(latest|current|recent|today|now|this week|this month|this year|2024|2025|2026)\b/,
    /\b(news|trending|happening|update|breaking)\b/,
    /\b(war|election|politics|stock|market price|bitcoin|crypto)\b/,
    /\b(weather|score|result|announcement)\b/,
    /\b(who is|what happened|when did|where is)\b.*\b(today|recently|now|currently)\b/,
    /\b(compare|vs|versus)\b.*\b(competitor|company|brand)\b/,
    /\b(regulation|law|policy|compliance)\b.*\b(new|recent|changed|updated)\b/,
  ];
  
  const needsWebSearch = webSearchPatterns.some(p => p.test(lastUserMessage) || p.test(allUserContent));
  
  if (needsWebSearch) {
    console.log('[streaming-chat] Auto-routing: detected web search intent');
    return { modelId: 'gpt-4o', useWebSearch: true };
  }
  
  // Default: fast model, no search
  return { modelId: 'gpt-4o-mini', useWebSearch: false };
}

const streamingChatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  integrationContext: z.any().optional(),
  userContext: userContextSchema,
  documentContext: z.array(documentContextSchema).max(20).optional(),
  pricingData: pricingDataSchema.nullable(),
  model: z.string().optional(),
});

interface DocumentContext {
  fileName: string;
  fileType: string;
  analysis?: string;
  markdown?: string;
  storagePath: string;
  id?: string;
}

async function analyzeDocumentIfNeeded(doc: DocumentContext, supabaseClient: any): Promise<string> {
  // If already analyzed, return existing analysis
  if (doc.analysis || doc.markdown) {
    return doc.analysis || doc.markdown || '';
  }

  console.log(`Analyzing document: ${doc.fileName} with enhanced extraction`);

  try {
    // Download the document from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('user-documents')
      .download(doc.storagePath);

    if (downloadError || !fileData) {
      console.error('Failed to download document:', downloadError);
      return `[Document ${doc.fileName} could not be analyzed]`;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Guard: skip files larger than 4MB to avoid memory limits
    if (uint8.byteLength > 4 * 1024 * 1024) {
      console.log(`Document ${doc.fileName} too large for in-function analysis (${(uint8.byteLength / 1024 / 1024).toFixed(1)}MB)`);
      return `[Document ${doc.fileName} is too large for inline analysis. Please re-upload a smaller version or a text-based format.]`;
    }

    // Convert to base64 in chunks to avoid memory spikes from spread operator
    let base64 = '';
    const chunkSize = 32768;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
      base64 += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    base64 = btoa(base64);

    // Detect document type
    const documentType = detectDocumentType(doc.fileName, doc.fileType);
    
    // Build enhanced system prompt
    const systemPrompt = buildEnhancedSystemPrompt(documentType);
    
    // Prepare messages for OpenAI
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Handle different file types
    if (doc.fileType.startsWith('image/') || doc.fileType === 'application/pdf') {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this document comprehensively. Extract all financial data, identify trends, and provide actionable insights.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${doc.fileType};base64,${base64}`
            }
          }
        ]
      });
    } else {
      // For text-based files
      const textContent = new TextDecoder().decode(arrayBuffer);
      messages.push({
        role: 'user',
        content: `Analyze this ${documentType} document comprehensively:\n\n${textContent.slice(0, 15000)}`
      });
    }

    // Use structured extraction with OpenAI function calling
    const tools = [{
      type: "function",
      function: {
        name: "extract_financial_data",
        description: "Extract structured financial data from the document",
        parameters: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: ["invoice", "bank_statement", "financial_statement", "receipt", "contract", "report", "spreadsheet", "other"]
            },
            summary: { type: "string", description: "2-3 sentence summary" },
            keyMetrics: {
              type: "object",
              properties: {
                revenue: { type: "number" },
                totalExpenses: { type: "number" },
                netAmount: { type: "number" },
                dateRange: { type: "string" }
              }
            },
            financialData: {
              type: "object",
              properties: {
                revenue: { type: "number" },
                expenses: { 
                  type: "array", 
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      amount: { type: "number" }
                    }
                  }
                },
                dates: { type: "array", items: { type: "string" } }
              }
            },
            insights: {
              type: "array",
              items: { type: "string" },
              description: "3-5 key insights"
            }
          },
          required: ["documentType", "summary"]
        }
      }
    }];

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
        tool_choice: { type: "function", function: { name: "extract_financial_data" } },
        max_tokens: 4000,
        temperature: 0.3
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      return `[Document ${doc.fileName} analysis failed]`;
    }

    const aiResult = await openAIResponse.json();
    let analysis: string;
    let structuredData: any = {};

    // Extract structured data from function call
    if (aiResult.choices?.[0]?.message?.tool_calls?.[0]) {
      const functionCall = aiResult.choices[0].message.tool_calls[0];
      structuredData = JSON.parse(functionCall.function.arguments);
      analysis = formatStructuredAnalysis(structuredData, doc.fileName);
    } else {
      analysis = aiResult.choices?.[0]?.message?.content || 'Analysis failed';
    }

    // Store the analysis and structured data in the database
    if (doc.id) {
      const { error: updateError } = await supabaseClient
        .from('documents')
        .update({
          markdown_content: analysis,
          processing_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', doc.id);

      if (updateError) {
        console.error('Failed to update document analysis:', updateError);
      }
    }

    console.log(`Document ${doc.fileName} analyzed successfully`);
    return analysis;
  } catch (error: any) {
    console.error('Error analyzing document:', error);
    return `[Document ${doc.fileName} could not be analyzed: ${error.message}]`;
  }
}

function detectDocumentType(filename: string, mimeType: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('invoice')) return 'invoice';
  if (lower.includes('statement') || lower.includes('bank')) return 'bank_statement';
  if (lower.includes('receipt')) return 'receipt';
  if (lower.includes('balance') || lower.includes('p&l')) return 'financial_statement';
  if (mimeType.includes('spreadsheet') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) return 'spreadsheet';
  
  return 'document';
}

function buildEnhancedSystemPrompt(documentType: string): string {
  const basePrompt = `You are an expert financial analyst and document processor. Extract and structure all relevant information comprehensively.`;
  
  const typePrompts: Record<string, string> = {
    invoice: `For invoices, extract: invoice number, dates, vendor/customer info, line items with quantities and prices, subtotals, taxes, total amount, and payment terms.`,
    bank_statement: `For bank statements, extract: account details, statement period, all transactions with dates/descriptions/amounts, opening and closing balances, and identify unusual patterns.`,
    financial_statement: `For financial statements, extract: statement type, reporting period, revenue by category, expenses by category, net profit/loss, key ratios, and trends.`,
    receipt: `For receipts, extract: merchant, date, items, prices, subtotal, tax, total, payment method, and categorize the purchase.`,
    spreadsheet: `For spreadsheets, identify all columns, extract numerical data, calculate totals and averages, identify trends, and structure the data logically.`
  };
  
  return `${basePrompt}\n\n${typePrompts[documentType] || 'Extract all relevant financial and business information.'}\n\nProvide structured extraction with clear categorization, calculations, and insights.`;
}

function formatStructuredAnalysis(data: any, fileName: string): string {
  let md = `# Analysis: ${fileName}\n\n`;
  md += `**Document Type:** ${data.documentType || 'Unknown'}\n\n`;
  
  if (data.summary) {
    md += `## Summary\n${data.summary}\n\n`;
  }
  
  if (data.keyMetrics) {
    md += `## Key Metrics\n`;
    Object.entries(data.keyMetrics).forEach(([key, value]) => {
      if (value) md += `- **${key}**: ${typeof value === 'number' ? `$${value.toLocaleString()}` : value}\n`;
    });
    md += `\n`;
  }
  
  if (data.financialData) {
    if (data.financialData.revenue) {
      md += `**Total Revenue:** $${data.financialData.revenue.toLocaleString()}\n\n`;
    }
    
    if (data.financialData.expenses?.length > 0) {
      md += `### Expenses\n`;
      const total = data.financialData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      data.financialData.expenses.forEach((exp: any) => {
        md += `- ${exp.category}: $${exp.amount.toLocaleString()}\n`;
      });
      md += `\n**Total Expenses:** $${total.toLocaleString()}\n\n`;
    }
  }
  
  if (data.insights?.length > 0) {
    md += `## Key Insights\n`;
    data.insights.forEach((insight: string) => md += `- ${insight}\n`);
    md += `\n`;
  }
  
  return md;
}

interface UserContext {
  name?: string;
  email?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  businessType?: string;
  businessProfile?: {
    legalName?: string;
    tradeName?: string;
    country?: string;
    currency?: string;
    industryNaics?: string;
    model?: string;
    startDate?: string;
    employees?: number;
    owners?: number;
  };
}

async function buildSystemPrompt(
  integrationContext?: any, 
  documentContext?: DocumentContext[],
  supabaseClient?: any,
  userContext?: UserContext,
  pricingData?: any,
  serverSideContext?: string
): Promise<string> {
  // Client-side pricing is no longer injected here.
  // All pricing data is fetched server-side and injected via serverSideContext.
  let pricingSection = '';

  let systemPrompt = pricingSection + `You are Vesta's AI CFO - a seasoned Chief Financial Officer with 25+ years of experience.

PRICING DATA RULES (only when asked about specific product prices/costs):
- Use EXACT dollar amounts from the pricing database above when discussing products.
- Example: If database says "Cost (COGS): $65.00", respond "$65.00" exactly.
- If a cost or price says "Not available", tell the user it is not set. NEVER invent or guess a number.
- If asked about a specific product that's NOT in the database, say "I don't have pricing data for that product."
- This rule ONLY applies to product-specific pricing questions - for general questions, respond normally.

RESPONSE STYLE:
- Be CONCISE. Simple questions get 1-3 sentences.
- Skip preambles - just answer directly.
- ALWAYS reference prior messages in this conversation. If the user refers to something discussed earlier, use that context.
- Maintain continuity: remember names, numbers, decisions, and topics from earlier in the chat.
- End with ONE bold summary using varied phrases: "**In short:**", "**The takeaway:**", "**Key point:**", etc.

MATH FORMATTING:
- Currency should be plain text like "$25.00" - NOT LaTeX.
- Use LaTeX only for math formulas: $PV = \\frac{FV}{(1+r)^n}$

Core Expertise: Business valuation, cash flow, M&A, financial modeling.

`;

  // Add user context if available
  if (userContext) {
    const contextParts: string[] = [];
    if (userContext.name) contextParts.push(`User: ${userContext.name}`);
    if (userContext.companyName) contextParts.push(`Company: ${userContext.companyName}`);
    if (userContext.industry) contextParts.push(`Industry: ${userContext.industry}`);
    if (userContext.companySize) contextParts.push(`Size: ${userContext.companySize}`);
    if (userContext.businessType) contextParts.push(`Type: ${userContext.businessType}`);
    
    if (userContext.businessProfile) {
      const bp = userContext.businessProfile;
      if (bp.legalName) contextParts.push(`Legal Name: ${bp.legalName}`);
      if (bp.country) contextParts.push(`Country: ${bp.country}`);
      if (bp.currency) contextParts.push(`Currency: ${bp.currency}`);
      if (bp.model) contextParts.push(`Business Model: ${bp.model}`);
      if (bp.startDate) contextParts.push(`Founded: ${bp.startDate}`);
      if (bp.employees) contextParts.push(`Employees: ${bp.employees}`);
    }
    
    if (contextParts.length > 0) {
      systemPrompt += `\n## User Profile\n${contextParts.join(' | ')}\n\n`;
    }
  }

  // Check if documents are uploaded
  const hasDocuments = documentContext && documentContext.length > 0 && supabaseClient;

  if (hasDocuments) {
    // PRIORITY MODE: Documents are primary source
    systemPrompt += `\n⚠️ IMPORTANT: The user has uploaded ${documentContext.length} document(s) for analysis. Your primary focus should be analyzing these uploaded documents. Do NOT reference the synced account data unless the user explicitly asks for a comparison or additional context.\n`;
    
    // Add document context as PRIMARY SOURCE
    systemPrompt += `\n## 📄 UPLOADED DOCUMENTS (PRIMARY SOURCE):\n\n`;
    
    // Aggregate document metrics
    
    for (const doc of documentContext) {
      const analysis = await analyzeDocumentIfNeeded(doc, supabaseClient);
      
      // Add document summary
      systemPrompt += `### 📄 ${doc.fileName}\n`;
      // Allow up to 50,000 chars per document so the AI can reference the full content
      systemPrompt += `${analysis.slice(0, 100000)}\n\n`;
    }
    
    // Add cross-document summary
    if (documentContext.length > 1) {
      systemPrompt += `\n### 📊 Cross-Document Summary:\n`;
      systemPrompt += `- **Total Documents:** ${documentContext.length}\n`;
      systemPrompt += `\n`;
    }
    
    systemPrompt += `When answering questions, reference specific documents by name and cite data points. Provide insights that connect information across multiple documents.\n\n`;

    // Add integration context as SUPPLEMENTARY (only if available)
    if (integrationContext?.knowledgeBase) {
      systemPrompt += `\n## 📊 SYNCED ACCOUNT DATA (SUPPLEMENTARY - Only use if user asks for comparison):\n`;
      systemPrompt += integrationContext.knowledgeBase;
      systemPrompt += '\n\n';
    }

  } else {
    // NO DOCUMENTS: Use integration data as primary source
    if (integrationContext?.knowledgeBase) {
      systemPrompt += `\n## 📊 Live Financial Data (${integrationContext.type}):\n`;
      systemPrompt += integrationContext.knowledgeBase;
      systemPrompt += '\n\n';
    }
  }

  // Pricing data is now added at the TOP of the prompt in buildSystemPrompt
  // This section is intentionally empty - pricing moved to beginning for priority

  // Append server-side enriched context (all user DB data)
  if (serverSideContext) {
    systemPrompt += `\n## 🗄️ COMPLETE USER DATA (Server-Side - Authoritative)\nThe following is the user's complete data from the database. Use this to answer ANY question about their business, finances, products, or operations.\n`;
    systemPrompt += serverSideContext;
    systemPrompt += '\n';
  }

  return systemPrompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // SECURITY: Authenticate user for server-side data fetching
    const authHeader = req.headers.get('Authorization');
    let authenticatedUserId: string | null = null;
    
    if (authHeader) {
      console.log('[streaming-chat] Auth header present, length:', authHeader.length);
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError) console.error('[streaming-chat] Auth error:', authError.message);
      if (user) {
        authenticatedUserId = user.id;
        console.log('[streaming-chat] Authenticated user:', user.id);
      } else {
        console.log('[streaming-chat] No user from auth header');
      }
    } else {
      console.log('[streaming-chat] No auth header present');
    }

    const rawBody = await req.json();

    // === Deep Research Poll: lightweight poll endpoint ===
    if (rawBody.action === 'poll-deep-research' && rawBody.responseId) {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
      const pollRes = await fetch(`https://api.openai.com/v1/responses/${rawBody.responseId}`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      });
      if (!pollRes.ok) {
        const errText = await pollRes.text();
        console.error("[deep-research-poll] Failed:", pollRes.status, errText);
        return new Response(JSON.stringify({ status: 'error', error: errText }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await pollRes.json();
      
      if (result.status === 'completed') {
        let outputText = '';
        const sources: { url: string; title: string }[] = [];
        
        if (result.output && Array.isArray(result.output)) {
          for (const item of result.output) {
            if (item.type === 'message' && item.content) {
              for (const content of item.content) {
                if (content.type === 'output_text' || content.type === 'text') {
                  outputText += content.text || '';
                  // Extract annotations/citations
                  if (content.annotations && Array.isArray(content.annotations)) {
                    for (const ann of content.annotations) {
                      if (ann.type === 'url_citation' && ann.url) {
                        sources.push({ url: ann.url, title: ann.title || ann.url });
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (!outputText && result.output_text) outputText = result.output_text;
        if (!outputText) outputText = "Deep research completed but no output was generated.";
        
        // Deduplicate sources by URL
        const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());
        
        return new Response(JSON.stringify({ status: 'completed', output: outputText, sources: uniqueSources }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ status: result.status || 'in_progress' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // SECURITY: Validate input with zod schema
    const validationResult = streamingChatSchema.safeParse(rawBody);
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

    const { messages, integrationContext, userContext, documentContext, pricingData, model: requestedModel } = validationResult.data;
    
    // Resolve the model to use
    let resolvedModelId = ALLOWED_MODELS[requestedModel || 'auto'] || 'auto';
    let autoWebSearch = false;
    
    // Smart routing for "auto" mode
    if (resolvedModelId === 'auto') {
      const routing = detectBestModel(messages);
      resolvedModelId = routing.modelId;
      autoWebSearch = routing.useWebSearch;
    }
    
    const isSearchModel = requestedModel === 'gpt-4o-search' || autoWebSearch;
    const isDeepResearch = resolvedModelId === 'o3-deep-research';
    console.log(`[streaming-chat] Using model: ${resolvedModelId} (requested: ${requestedModel || 'auto'}, search: ${isSearchModel}, autoWebSearch: ${autoWebSearch}, deepResearch: ${isDeepResearch})`);
    
    // Debug: Log pricing data received from frontend
    if (pricingData?.products?.length) {
      const sampleProduct = pricingData.products[0];
      console.log(`[streaming-chat] Received pricing data - Sample product:`, JSON.stringify({
        upc: sampleProduct.upc,
        brand: sampleProduct.brand,
        cogs: sampleProduct.cogs,
        baseCost: sampleProduct.baseCost,
        supplierPricesCount: sampleProduct.supplierPrices?.length,
        firstSupplierPrice: sampleProduct.supplierPrices?.[0]
      }));
    }
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Create Supabase client for document analysis and data fetching
    const supabaseUrl2 = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseClient = createClient(supabaseUrl2, supabaseServiceKey);

    // === SERVER-SIDE DATA ENRICHMENT ===
    let serverSideContext = '';
    if (authenticatedUserId) {
      console.log('[streaming-chat] Fetching server-side data for user:', authenticatedUserId);
      
      const [
        { data: financialData },
        { data: financialSnapshots },
        { data: businessProfile },
        { data: activeFeatures },
        { data: qbIntegration },
        { data: qbData },
        { data: pricingProducts },
      ] = await Promise.all([
        supabaseClient.from('financial_data').select('*').eq('user_id', authenticatedUserId).order('period_end', { ascending: false }).limit(24),
        supabaseClient.from('financial_snapshots').select('*').eq('user_id', authenticatedUserId).order('period_end', { ascending: false }).limit(12),
        supabaseClient.from('business_profiles').select('*').eq('user_id', authenticatedUserId).maybeSingle(),
        supabaseClient.from('consumer_features').select('feature_key, enabled').eq('user_id', authenticatedUserId).eq('enabled', true),
        supabaseClient.from('quickbooks_integrations').select('company_name, is_active').eq('user_id', authenticatedUserId).eq('is_active', true).maybeSingle(),
        supabaseClient.from('quickbooks_data').select('data_type, data_json').eq('user_id', authenticatedUserId),
        supabaseClient.from('pricing_products').select('*, supplier_prices:pricing_supplier_prices(*, supplier:pricing_suppliers(name, country, currency)), ai_recommendation:pricing_ai_recommendations(optimal_price, reasoning)').limit(2000),
      ]);

      if (businessProfile) {
        serverSideContext += `\n## Business Profile (from database)\n`;
        serverSideContext += `Legal Name: ${businessProfile.legal_name || 'N/A'} | Trade Name: ${businessProfile.trade_name || 'N/A'}\n`;
        serverSideContext += `Country: ${businessProfile.country || 'N/A'} | Currency: ${businessProfile.currency || 'USD'}\n`;
        serverSideContext += `Model: ${businessProfile.model || 'N/A'} | Industry NAICS: ${businessProfile.industry_naics || 'N/A'}\n`;
        serverSideContext += `Employees: ${businessProfile.employees_fulltime || 'N/A'} | Owners: ${businessProfile.owners_count || 'N/A'}\n`;
        if (businessProfile.start_date) serverSideContext += `Founded: ${businessProfile.start_date}\n`;
        serverSideContext += '\n';
      }

      if (activeFeatures && activeFeatures.length > 0) {
        serverSideContext += `## Active Feature Modules\n`;
        serverSideContext += activeFeatures.map((f: any) => f.feature_key).join(', ') + '\n\n';
      }

      if (financialData && financialData.length > 0) {
        serverSideContext += `## Financial Data (${financialData.length} periods)\n`;
        financialData.forEach((fd: any) => {
          serverSideContext += `Period ${fd.period_start} to ${fd.period_end}: Revenue $${fd.revenue || 0} | Expenses $${fd.expenses || 0} | Profit $${fd.profit || 0} | Cash Flow $${fd.cash_flow || 0}\n`;
        });
        serverSideContext += '\n';
      }

      if (financialSnapshots && financialSnapshots.length > 0) {
        serverSideContext += `## Financial Snapshots (${financialSnapshots.length} periods)\n`;
        financialSnapshots.forEach((fs: any) => {
          const parts: string[] = [];
          if (fs.revenue) parts.push(`Revenue: $${fs.revenue}`);
          if (fs.mrr) parts.push(`MRR: $${fs.mrr}`);
          if (fs.arr) parts.push(`ARR: $${fs.arr}`);
          if (fs.ebitda) parts.push(`EBITDA: $${fs.ebitda}`);
          if (fs.sde) parts.push(`SDE: $${fs.sde}`);
          if (fs.gross_margin_pct) parts.push(`Gross Margin: ${fs.gross_margin_pct}%`);
          if (fs.cash_balance) parts.push(`Cash: $${fs.cash_balance}`);
          if (parts.length > 0) {
            serverSideContext += `${fs.period_start} to ${fs.period_end}: ${parts.join(' | ')}\n`;
          }
        });
        serverSideContext += '\n';
      }

      if (qbIntegration) {
        serverSideContext += `## Connected Accounting: QuickBooks (${qbIntegration.company_name})\n`;
        if (qbData && qbData.length > 0) {
          const byType: Record<string, any[]> = {};
          qbData.forEach((item: any) => {
            if (!byType[item.data_type]) byType[item.data_type] = [];
            byType[item.data_type].push(item.data_json);
          });
          Object.entries(byType).forEach(([type, items]) => {
            serverSideContext += `### ${type} (${items.length} records)\n`;
            const serialized = JSON.stringify(items.slice(0, 200), null, 1);
            serverSideContext += serialized.slice(0, 50000) + '\n';
          });
        }
        serverSideContext += '\n';
      }

      if (pricingProducts && pricingProducts.length > 0) {
        serverSideContext += `\n=== CRITICAL: PRODUCT & PRICING DATABASE (${pricingProducts.length} products) ===\n`;
        serverSideContext += `READ THESE VALUES CAREFULLY. When asked about prices, COPY the exact values below.\n\n`;
        pricingProducts.forEach((p: any, i: number) => {
          serverSideContext += `PRODUCT ${i+1}: ${p.brand || 'Unknown'} - ${p.description || ''}\n`;
          serverSideContext += `  UPC: ${p.upc}\n`;
          const cogsVal = p.cogs != null ? Number(p.cogs) : NaN;
          const baseVal = p.base_cost != null ? Number(p.base_cost) : NaN;
          const costValue = (!isNaN(cogsVal) && cogsVal > 0) ? cogsVal : ((!isNaN(baseVal) && baseVal > 0) ? baseVal : null);
          serverSideContext += `  Cost (COGS): ${costValue !== null ? '$' + costValue.toFixed(2) : 'Not available'}\n`;
          if (p.size) serverSideContext += `  Size: ${p.size}\n`;
          if (p.gender) serverSideContext += `  Gender: ${p.gender}\n`;
          if (p.product_type) serverSideContext += `  Type: ${p.product_type}\n`;
          if (p.target_margin) serverSideContext += `  Target Margin: ${p.target_margin}%\n`;
          if (p.supplier_prices?.length) {
            p.supplier_prices.forEach((sp: any) => {
              const priceVal = sp.price != null ? Number(sp.price) : NaN;
              serverSideContext += `  Supplier "${sp.supplier?.name || 'Unknown'}": ${!isNaN(priceVal) ? '$' + priceVal.toFixed(2) : 'N/A'}${sp.country ? ' (' + sp.country + ')' : ''}${sp.currency ? ' ' + sp.currency : ''}${sp.availability != null ? ' | Avail: ' + sp.availability : ''}${sp.min_order_qty != null ? ' | MOQ: ' + sp.min_order_qty : ''}\n`;
            });
          }
          if (p.ai_recommendation?.length && p.ai_recommendation[0]?.optimal_price) {
            const optVal = Number(p.ai_recommendation[0].optimal_price);
            serverSideContext += `  AI Recommended: ${!isNaN(optVal) ? '$' + optVal.toFixed(2) : 'N/A'}`;
            if (p.ai_recommendation[0].reasoning) serverSideContext += ` (${p.ai_recommendation[0].reasoning})`;
            serverSideContext += '\n';
          }
          serverSideContext += '\n';
        });
        serverSideContext += `=== END PRICING DATABASE ===\n\n`;
      }

      console.log(`[streaming-chat] Server-side context length: ${serverSideContext.length} chars`);
    }

    const systemPrompt = await buildSystemPrompt(integrationContext, documentContext, supabaseClient, userContext, pricingData, serverSideContext);
    
    // Debug: Log a portion of the system prompt to verify pricing data formatting
    const pricingSection = systemPrompt.match(/💰 PRODUCT & PRICING DATA[\s\S]{0,2000}/);
    if (pricingSection) {
      console.log('[streaming-chat] System prompt pricing section (first 2000 chars):', pricingSection[0]);
    }
    
    // Use OpenAI GPT-4o-mini for accurate data extraction
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // === Deep Research: start and return response ID immediately (client polls) ===
    if (isDeepResearch) {
      const userInput = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      console.log('[streaming-chat] Starting deep research for input:', userInput.slice(0, 200));

      const startRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "o3-deep-research",
          input: systemPrompt + "\n\nUser question: " + userInput,
          tools: [{ type: "web_search_preview" }],
          background: true,
        }),
      });

      if (!startRes.ok) {
        const errText = await startRes.text();
        console.error("[deep-research] Start failed:", startRes.status, errText);
        if (startRes.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Deep research failed to start" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await startRes.json();
      console.log('[deep-research] Response ID:', result.id, 'Status:', result.status);

      // If already completed (rare), return output directly
      if (result.status === 'completed') {
        let outputText = '';
        if (result.output && Array.isArray(result.output)) {
          for (const item of result.output) {
            if (item.type === 'message' && item.content) {
              for (const c of item.content) {
                if (c.type === 'output_text' || c.type === 'text') outputText += c.text || '';
              }
            }
          }
        }
        if (!outputText && result.output_text) outputText = result.output_text;
        if (!outputText) outputText = "Deep research completed but no output was generated.";
        
        const ssePayload = `data: ${JSON.stringify({ choices: [{ delta: { content: outputText } }] })}\n\ndata: [DONE]\n\n`;
        return new Response(ssePayload, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Return response ID for client-side polling
      return new Response(JSON.stringify({ 
        deepResearch: true, 
        responseId: result.id, 
        status: result.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Standard chat completions flow ===
    // All models now use non-streaming to reliably extract web search citations,
    // then simulate streaming for progressive rendering on the client.
    const noTemperatureModels = ['gpt-4o-search-preview', 'o3-mini', 'o3-deep-research', 'gpt-5'];
    const maxCompletionTokensModels = ['o3-mini', 'gpt-5'];
    const supportsTemperature = !noTemperatureModels.includes(resolvedModelId);
    const usesMaxCompletionTokens = maxCompletionTokensModels.includes(resolvedModelId);

    // Models that support web search via Responses API
    const webSearchModels = ['gpt-4o', 'gpt-4o-mini'];
    const supportsWebSearch = webSearchModels.includes(resolvedModelId) && (isSearchModel || autoWebSearch);

    let content = '';
    let uniqueSources: Array<{ url: string; title: string }> = [];

    if (supportsWebSearch) {
      // Use Responses API for web search + citations
      const responsesBody: any = {
        model: resolvedModelId,
        input: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [{ type: "web_search_preview", search_context_size: "medium" }],
      };

      if (supportsTemperature) {
        responsesBody.temperature = 0.3;
      }

      const responsesApiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responsesBody),
      });

      if (!responsesApiResponse.ok) {
        const errorText = await responsesApiResponse.text();
        console.error("OpenAI Responses API error:", responsesApiResponse.status, errorText);
        if (responsesApiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI API error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const responsesResult = await responsesApiResponse.json();
      console.log(`[streaming-chat] Responses API result keys: ${Object.keys(responsesResult).join(', ')}`);
      
      // Extract content and annotations from Responses API output
      const outputItems = responsesResult.output || [];
      for (const item of outputItems) {
        if (item.type === 'message' && item.content) {
          for (const part of item.content) {
            if (part.type === 'output_text') {
              content += part.text || '';
              // Extract annotations/citations
              const annotations = part.annotations || [];
              for (const ann of annotations) {
                if (ann.type === 'url_citation' && ann.url) {
                  uniqueSources.push({ url: ann.url, title: ann.title || ann.url });
                }
              }
            }
          }
        }
      }
      uniqueSources = Array.from(new Map(uniqueSources.map(s => [s.url, s])).values());
      console.log(`[streaming-chat] Responses API returned ${uniqueSources.length} sources`);

    } else {
      // Use standard Chat Completions API for non-search models
      const chatBody: any = {
        model: resolvedModelId,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      };

      if (usesMaxCompletionTokens) {
        chatBody.max_completion_tokens = 4000;
      } else {
        chatBody.max_tokens = 4000;
      }

      if (supportsTemperature) {
        chatBody.temperature = 0.3;
      }

      const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatBody),
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error("OpenAI API error:", chatResponse.status, errorText);
        if (chatResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI API error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const chatResult = await chatResponse.json();
      const message = chatResult.choices?.[0]?.message;
      content = message?.content || '';
    }

    console.log(`[streaming-chat] Model ${resolvedModelId} final sources: ${uniqueSources.length}`);

    // Stream the content back as SSE with small delays for natural typing feel
    const encoder = new TextEncoder();
    const chunkSize = 12;
    const stream = new ReadableStream({
      async start(controller) {
        // Send sources first so they appear while text is streaming
        if (uniqueSources.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources: uniqueSources })}\n\n`));
        }
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`));
          // Small delay between chunks for natural typing effect
          await new Promise(r => setTimeout(r, 15));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("streaming chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
