import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-client-wrapper';
import { useToast } from '@/hooks/use-toast';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useTeamRole } from '@/hooks/useTeamRole';
import { useConsumerFeatures } from '@/hooks/useConsumerFeatures';

// Generate dynamic deep research status messages based on user's query
function generateDynamicResearchSteps(query: string): string[] {
  const q = query.toLowerCase();
  
  if (q.includes('competitor') || q.includes('market') || q.includes('industry')) {
    return [
      'Analyzing your market research question...',
      'Searching competitor databases and industry reports...',
      'Evaluating market positioning and trends...',
      'Cross-referencing industry benchmarks...',
      'Synthesizing competitive analysis...',
      'Compiling market intelligence report...',
      'Finalizing competitive insights...',
    ];
  }
  if (q.includes('tax') || q.includes('deduction') || q.includes('irs') || q.includes('compliance')) {
    return [
      'Parsing your tax-related question...',
      'Searching tax regulations and IRS guidelines...',
      'Reviewing applicable deductions and credits...',
      'Cross-checking compliance requirements...',
      'Evaluating tax optimization strategies...',
      'Compiling tax analysis findings...',
      'Finalizing tax advisory report...',
    ];
  }
  if (q.includes('invest') || q.includes('stock') || q.includes('fund') || q.includes('portfolio')) {
    return [
      'Understanding your investment question...',
      'Researching financial markets and instruments...',
      'Analyzing historical performance data...',
      'Evaluating risk-return profiles...',
      'Synthesizing investment insights...',
      'Compiling portfolio recommendations...',
      'Finalizing investment analysis...',
    ];
  }
  if (q.includes('growth') || q.includes('scale') || q.includes('expand') || q.includes('strategy')) {
    return [
      'Analyzing your growth strategy question...',
      'Researching scaling frameworks and case studies...',
      'Evaluating expansion opportunities...',
      'Assessing operational readiness factors...',
      'Synthesizing strategic recommendations...',
      'Compiling growth roadmap...',
      'Finalizing strategic analysis...',
    ];
  }
  if (q.includes('cash flow') || q.includes('revenue') || q.includes('profit') || q.includes('expense')) {
    return [
      'Examining your financial question...',
      'Analyzing income and expense patterns...',
      'Reviewing cash flow dynamics...',
      'Benchmarking against industry standards...',
      'Identifying optimization opportunities...',
      'Compiling financial analysis...',
      'Finalizing performance report...',
    ];
  }
  const keyTerms = query.split(/\s+/).filter(w => w.length > 4).slice(0, 3).join(', ');
  return [
    `Analyzing your question about ${keyTerms || 'this topic'}...`,
    'Searching across relevant data sources...',
    'Reading and evaluating findings...',
    'Cross-referencing multiple perspectives...',
    'Synthesizing research results...',
    'Compiling comprehensive answer...',
    'Finalizing research report...',
  ];
}

interface MessageSource {
  url: string;
  title: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: MessageSource[];
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface DocumentContext {
  id: string;
  fileName: string;
  fileType: string;
  analysis?: string;
  markdown?: string;
  storagePath: string;
  attachedAt: string;
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

interface PricingDataForAI {
  products: Array<{
    upc: string;
    brand: string | null;
    description: string | null;
    productType: string | null;
    size: string | null;
    gender: string | null;
    baseCost: number | null;
    cogs: number | null;
    targetMargin: number | null;
    supplierPrices?: Array<{
      supplierName: string;
      price: number;
      country: string | null;
      availability: number | null;
      minOrderQty: number | null;
    }>;
    aiRecommendation?: {
      optimalPrice: number;
      reasoning: string | null;
    };
  }>;
  suppliers: Array<{
    name: string;
    country: string | null;
    currency: string;
  }>;
}

export const useQuickBooksChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentContext[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<Array<{ id: string; storagePath: string; fileName: string; fileType: string; extractedContent?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [deepResearchStatus, setDeepResearchStatus] = useState<{
    isPolling: boolean;
    elapsedSeconds: number;
    statusMessage: string;
  } | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [pricingData, setPricingData] = useState<PricingDataForAI | null>(null);
  const { toast } = useToast();
  const { getKnowledgeBase, integration } = useQuickBooksIntegration();
  const { effectiveUserId, isMember } = useTeamRole();
  const { hasFeature, isCustomSolution, loading: featuresLoading } = useConsumerFeatures(effectiveUserId || undefined);
  
  // Derive a boolean so the useEffect re-fires when features finish loading
  const hasPricingFeature = hasFeature('competitive_pricing');
  
  // Use ref to track current conversation ID for async operations
  const currentConversationIdRef = useRef<string | undefined>(currentConversationId);
  
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Load user profile and business profile for context
  // Uses effectiveUserId to get team owner's data for team members
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use effectiveUserId for team members to get owner's business context
        const targetUserId = effectiveUserId || user.id;

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, company_name, industry, company_size, business_type')
          .eq('user_id', targetUserId)
          .single();

        // Fetch business profile
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('legal_name, trade_name, country, currency, industry_naics, model, start_date, employees_fulltime, owners_count')
          .eq('user_id', targetUserId)
          .single();

        setUserContext({
          name: profile?.full_name || user.user_metadata?.full_name,
          email: profile?.email || user.email,
          companyName: profile?.company_name,
          industry: profile?.industry,
          companySize: profile?.company_size,
          businessType: profile?.business_type,
          businessProfile: businessProfile ? {
            legalName: businessProfile.legal_name,
            tradeName: businessProfile.trade_name,
            country: businessProfile.country,
            currency: businessProfile.currency,
            industryNaics: businessProfile.industry_naics,
            model: businessProfile.model,
            startDate: businessProfile.start_date,
            employees: businessProfile.employees_fulltime,
            owners: businessProfile.owners_count,
          } : undefined
        });
      } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

    loadUserContext();
  }, [effectiveUserId]);

  // Load pricing data if competitive_pricing feature is enabled or user is custom solution
  useEffect(() => {
    const loadPricingData = async () => {
      // Don't decide until features have finished loading
      if (featuresLoading) return;
      
      if (!hasPricingFeature && !isCustomSolution) {
        setPricingData(null);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch ALL products from the shared catalog (not filtered by user_id)
        const { data: products, error: productsError } = await supabase
          .from('pricing_products')
          .select(`
            id,
            upc,
            brand,
            description,
            product_type,
            size,
            gender,
            base_cost,
            cogs,
            target_margin,
            supplier_prices:pricing_supplier_prices(
              id,
              price,
              currency,
              country,
              availability,
              min_order_qty,
              price_type,
              supplier:pricing_suppliers(id, name, country, currency)
            )
          `);
        
        if (productsError) {
          console.error('Error fetching pricing products:', productsError);
        }
        
        // Debug: Log the raw products data to verify price values
        console.log('[PricingData] Raw products from DB:', JSON.stringify(products?.slice(0, 2), null, 2));

        // Fetch all active suppliers from the shared catalog
        const { data: suppliers } = await supabase
          .from('pricing_suppliers')
          .select('name, country, currency')
          .eq('is_active', true);

        // Fetch all AI recommendations
        const { data: recommendations } = await supabase
          .from('pricing_ai_recommendations')
          .select('product_id, optimal_price, reasoning');

        const recommendationMap = new Map(
          recommendations?.map(r => [r.product_id, r]) || []
        );

        const formattedProducts = (products || []).map((p: any) => {
          // Map supplier prices with explicit number parsing
          const mappedSupplierPrices = (p.supplier_prices || []).map((sp: any) => {
            const priceValue = typeof sp.price === 'number' ? sp.price : parseFloat(sp.price) || 0;
            return {
              supplierName: sp.supplier?.name || 'Unknown',
              price: priceValue,
              country: sp.country,
              availability: sp.availability,
              minOrderQty: sp.min_order_qty,
            };
          });
          
          return {
            upc: p.upc,
            brand: p.brand,
            description: p.description,
            productType: p.product_type,
            size: p.size,
            gender: p.gender,
            baseCost: typeof p.base_cost === 'number' ? p.base_cost : parseFloat(p.base_cost) || null,
            cogs: typeof p.cogs === 'number' ? p.cogs : parseFloat(p.cogs) || null,
            targetMargin: p.target_margin,
            supplierPrices: mappedSupplierPrices,
            aiRecommendation: recommendationMap.get(p.id) ? {
              optimalPrice: recommendationMap.get(p.id)!.optimal_price,
              reasoning: recommendationMap.get(p.id)!.reasoning,
            } : undefined,
          };
        });
        
        // Debug: Log formatted products to verify prices are correct
        console.log('[PricingData] Formatted products sample:', JSON.stringify(formattedProducts.slice(0, 2).map(p => ({
          upc: p.upc,
          brand: p.brand,
          cogs: p.cogs,
          baseCost: p.baseCost,
          supplierPrices: p.supplierPrices?.slice(0, 2)
        })), null, 2));

        setPricingData({
          products: formattedProducts,
          suppliers: (suppliers || []).map((s: any) => ({
            name: s.name,
            country: s.country,
            currency: s.currency,
          })),
        });
        
        console.log('[PricingData] Set pricing data with', formattedProducts.length, 'products');
      } catch (error) {
        console.error('Error loading pricing data:', error);
      }
    };

    loadPricingData();
  }, [effectiveUserId, hasPricingFeature, isCustomSolution, featuresLoading]);
  const loadConversations = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('quickbooks_conversations')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('quickbooks_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation messages.",
        variant: "destructive"
      });
    }
  };

  // Load documents attached to a conversation
  const loadConversationDocuments = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_documents')
        .select(`
          document_id,
          attached_at,
          documents:document_id (
            id,
            file_name,
            file_type,
            markdown_content,
            storage_path
          )
        `)
        .eq('conversation_id', convId);

      if (error) throw error;

      const docs: DocumentContext[] = (data || []).map((d: any) => ({
        id: d.documents.id,
        fileName: d.documents.file_name,
        fileType: d.documents.file_type,
        analysis: d.documents.markdown_content || undefined,
        markdown: d.documents.markdown_content || undefined,
        storagePath: d.documents.storage_path,
        attachedAt: d.attached_at
      }));

      setAttachedDocuments(docs);
    } catch (error: any) {
      console.error('Error loading conversation documents:', error);
    }
  };

  // Attach a document to the current conversation
  const attachDocument = async (documentId: string, storagePath: string, fileName: string, fileType: string, extractedContent?: string) => {
    if (!currentConversationId) {
      // No conversation yet - store as pending
      setPendingDocuments(prev => [...prev, { id: documentId, storagePath, fileName, fileType, extractedContent }]);
      return;
    }

    try {
      const { error } = await supabase
        .from('conversation_documents')
        .insert({
          conversation_id: currentConversationId,
          document_id: documentId
        });

      if (error) throw error;

      await loadConversationDocuments(currentConversationId);
      
      // If we have extracted content that wasn't saved during upload, add it to attached docs
      if (extractedContent) {
        setAttachedDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, analysis: extractedContent, markdown: extractedContent }
            : doc
        ));
      }
    } catch (error: any) {
      console.error('Error attaching document:', error);
      toast({
        title: "Error",
        description: "Failed to attach document to conversation.",
        variant: "destructive"
      });
    }
  };

  // Remove a document from the current conversation
  const removeDocument = async (documentId: string) => {
    if (!currentConversationId) return;

    try {
      const { error } = await supabase
        .from('conversation_documents')
        .delete()
        .eq('conversation_id', currentConversationId)
        .eq('document_id', documentId);

      if (error) throw error;

      setAttachedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Document removed",
        description: "Document has been removed from this conversation",
      });
    } catch (error: any) {
      console.error('Error removing document:', error);
      toast({
        title: "Error",
        description: "Failed to remove document from conversation.",
        variant: "destructive"
      });
    }
  };

  // Send message
  const sendMessage = async (content: string, isNewConversation = false, model?: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setIsWaitingForResponse(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create conversation if needed
      let conversationId = currentConversationId;
      
      // For team members, use effectiveUserId (owner's ID) so conversations are shared
      const conversationOwnerId = effectiveUserId || user.id;
      
      if (!conversationId || isNewConversation) {
        const conversationTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        
        const { data: newConv, error: convError } = await (supabase as any)
          .from('quickbooks_conversations')
          .insert({
            user_id: conversationOwnerId,
            title: conversationTitle
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          throw new Error('Failed to create conversation');
        }

        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
        
        // Attach any pending documents to the new conversation
        if (pendingDocuments.length > 0) {
          for (const doc of pendingDocuments) {
            await supabase
              .from('conversation_documents')
              .insert({
                conversation_id: conversationId,
                document_id: doc.id
              });
          }
          // Don't clear yet - we need them for the request below
          await loadConversationDocuments(conversationId);
        }
      }

      // Save user message to database
      const { error: userMsgError } = await (supabase as any)
        .from('quickbooks_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: content.trim()
        });

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
      }

      setIsStreaming(true);
      let fullAssistantResponse = '';
      
      // Debug: confirm pricing data is being sent
      console.log('[Chat] Sending message with pricingData:', pricingData ? `${pricingData.products.length} products` : 'NULL');
      
      // Start streaming chat
      let pendingSources: MessageSource[] = [];
      await streamChat({
        messages: [...messages, userMessage],
        model: model,
        onSources: (sources: MessageSource[]) => {
          pendingSources = sources;
        },
        onDelta: (deltaText: string) => {
          setIsWaitingForResponse(false);
          fullAssistantResponse += deltaText;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            // If last message is not assistant, create one
            if (!lastMessage || lastMessage.role !== 'assistant') {
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant', 
                content: deltaText,
                timestamp: new Date(),
                sources: pendingSources.length > 0 ? pendingSources : undefined,
              };
              return [...newMessages, assistantMessage];
            } else {
              // Update existing assistant message
              lastMessage.content += deltaText;
              if (pendingSources.length > 0) {
                lastMessage.sources = pendingSources;
              }
              return newMessages;
            }
          });
        },
        onDone: async () => {
          // Attach sources to the final message
          if (pendingSources.length > 0) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') {
                lastMsg.sources = pendingSources;
              }
              return [...newMessages];
            });
          }

          // Save assistant message to database
          if (fullAssistantResponse && conversationId) {
            const { error: assistantMsgError } = await (supabase as any)
              .from('quickbooks_messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullAssistantResponse
              });

            if (assistantMsgError) {
              console.error('Error saving assistant message:', assistantMsgError);
            }

            // Update conversation timestamp
            await (supabase as any)
              .from('quickbooks_conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId);
          }

          setLoading(false);
          setIsStreaming(false);
          // Reload conversations to update the list
          loadConversations();
        }
      });
      
      // Clear pending documents after stream has started
      if (pendingDocuments.length > 0) {
        setPendingDocuments([]);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive"
      });
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setLoading(false);
      setIsStreaming(false);
    }
  };

  // Streaming function
  const streamChat = async ({
    messages,
    model,
    onDelta,
    onDone,
    onSources,
  }: {
    messages: Message[];
    model?: string;
    onDelta: (deltaText: string) => void;
    onDone: () => void;
    onSources?: (sources: MessageSource[]) => void;
  }) => {
    const CHAT_URL = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/streaming-chat`;

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error('Not signed in. Refresh the page and try again.');
    }

    const invokeHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: invokeHeaders,
      body: JSON.stringify({ 
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: model,
        integrationContext: {
          type: 'quickbooks',
          knowledgeBase: getKnowledgeBase(),
          companyName: integration?.company_name
        },
        userContext: userContext,
        documentContext: (() => {
          // Use pending documents if attachedDocuments hasn't updated yet
          const pending = pendingDocuments;
          if (pending.length > 0) {
            return pending.map(doc => ({
              fileName: doc.fileName,
              fileType: doc.fileType,
              analysis: doc.extractedContent || undefined,
              markdown: doc.extractedContent || undefined,
              storagePath: doc.storagePath,
            }));
          }
          return attachedDocuments.map(doc => ({
            fileName: doc.fileName,
            fileType: doc.fileType,
            analysis: doc.analysis,
            markdown: doc.markdown,
            storagePath: doc.storagePath,
          }));
        })(),
        pricingData: null
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      const errorData = await response.json().catch(() => ({ error: "Failed to start stream" }));
      throw new Error(errorData.error || "Failed to start stream");
    }

    // Check if this is a deep research response (JSON with responseId, not SSE stream)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      if (jsonData.deepResearch && jsonData.responseId) {
        // Poll for deep research completion with progress tracking
        const pollInterval = 5000;
        const maxPollTime = 10 * 60 * 1000;
        const startTime = Date.now();
        
        // Generate dynamic status messages based on the user's actual query
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        const statusMessages = generateDynamicResearchSteps(lastUserMsg);
        
        let pollCount = 0;
        setDeepResearchStatus({
          isPolling: true,
          elapsedSeconds: 0,
          statusMessage: statusMessages[0],
        });
        
        while (Date.now() - startTime < maxPollTime) {
          await new Promise(r => setTimeout(r, pollInterval));
          pollCount++;
          
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const msgIndex = Math.min(Math.floor(pollCount / 3), statusMessages.length - 1);
          setDeepResearchStatus({
            isPolling: true,
            elapsedSeconds: elapsed,
            statusMessage: statusMessages[msgIndex],
          });
          
          const pollRes = await fetch(CHAT_URL, {
            method: 'POST',
            headers: invokeHeaders,
            body: JSON.stringify({
              action: 'poll-deep-research',
              responseId: jsonData.responseId,
            }),
          });
          
          if (!pollRes.ok) {
            setDeepResearchStatus(null);
            throw new Error("Failed to poll deep research status");
          }
          
          const pollData = await pollRes.json();
          
          if (pollData.status === 'completed' && pollData.output) {
            setDeepResearchStatus(null);
            if (pollData.sources && onSources) {
              onSources(pollData.sources);
            }
            onDelta(pollData.output);
            onDone();
            return;
          } else if (pollData.status === 'failed' || pollData.status === 'error') {
            setDeepResearchStatus(null);
            throw new Error(pollData.error || "Deep research failed");
          }
        }
        
        setDeepResearchStatus(null);
        throw new Error("Deep research timed out after 10 minutes");
      }
      // Other JSON responses (shouldn't happen normally)
      throw new Error(jsonData.error || "Unexpected response format");
    }
    
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line as data arrives
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);   // handle CRLF
        if (line.startsWith(":") || line.trim() === "") continue; // SSE comments/keepalive
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          // Check for sources event (sent by search models)
          if (parsed.sources && Array.isArray(parsed.sources) && onSources) {
            onSources(parsed.sources);
          } else {
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content); // emit token(s) immediately
          }
        } catch {
          // Incomplete JSON split across chunks: put it back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush in case remaining buffered lines arrived without trailing newline
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.sources && Array.isArray(parsed.sources) && onSources) {
            onSources(parsed.sources);
          } else {
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          }
        } catch { /* ignore partial leftovers */ }
      }
    }

    onDone();
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversationId(undefined);
    setMessages([]);
    setAttachedDocuments([]);
    setPendingDocuments([]);
    // Reload conversations to refresh the list
    setTimeout(() => loadConversations(), 100);
  };

  // Load specific conversation
  const loadConversation = async (convId: string) => {
    setCurrentConversationId(convId);
    await loadMessages(convId);
  };

  // Sync with external conversation ID - use useLayoutEffect for synchronous clearing
  useLayoutEffect(() => {
    if (conversationId === undefined) {
      // Immediately clear all state when starting new conversation
      setCurrentConversationId(undefined);
      setMessages([]);
      setAttachedDocuments([]);
      setPendingDocuments([]);
    } else {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation ID changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
      loadConversationDocuments(currentConversationId);
    } else {
      setMessages([]);
      setAttachedDocuments([]);
    }
  }, [currentConversationId]);

  return {
    messages,
    setMessages,
    conversations,
    attachedDocuments,
    pendingDocuments,
    setPendingDocuments,
    loading,
    setLoading,
    currentConversationId,
    setCurrentConversationId,
    sendMessage,
    startNewConversation,
    loadConversation,
    loadConversations,
    attachDocument,
    removeDocument,
    isStreaming,
    setIsStreaming,
    isWaitingForResponse,
    deepResearchStatus,
  };
};