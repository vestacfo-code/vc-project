import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Mic, Building2, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { VestaBrand } from '@/components/ui/vesta-brand';
import ReactMarkdown from 'react-markdown';
import ThinkingAnimation from '@/components/ThinkingAnimation';
import TypingAnimation from '@/components/TypingAnimation';
import FinancialChart from '@/components/FinancialChart';
import { useFinancialChartData } from '@/hooks/useFinancialChartData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSettings } from '@/contexts/SettingsContext';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: {
    type: 'revenue' | 'expenses' | 'cash_flow' | 'profit';
    data: any[];
    title: string;
  };
}
interface ChatGPTStyleChatProps {
  sessionId?: string;
  testMode?: boolean;
}
const ChatGPTStyleChat = ({
  sessionId,
  testMode = false
}: ChatGPTStyleChatProps) => {
  const {
    integration,
    getKnowledgeBase
  } = useQuickBooksIntegration();
  const {
    detectChartType,
    generateMockData,
    getChartTitle,
    hasIntegration
  } = useFinancialChartData();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProcessingMessage, setCurrentProcessingMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    toast
  } = useToast();

  // Clear messages when sessionId changes to undefined (new chat)
  useEffect(() => {
    if (sessionId === undefined) {
      setMessages([]);
      setInput('');
    }
  }, [sessionId]);
  const models = [{
    id: 'google/gemini-2.5-flash',
    name: 'Best',
    icon: '⚡'
  }, {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    icon: '🚀'
  }];
  const cfoQuestions = ["How is our cash flow looking this quarter?", "What are our biggest expense categories?", "How can we improve our profit margins?", "Which customers drive the most revenue?", "Are we on track to meet our financial goals?", "What trends do you see in our business performance?", "How efficient is our working capital management?", "Should we be concerned about any financial risks?"];
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentProcessingMessage(input.trim());
    setInput('');
    setLoading(true);
    try {
      const knowledgeBase = getKnowledgeBase();
      
      // Build language-aware system prompt
      const languageInstructions = settings.language !== 'auto' 
        ? `\n\nIMPORTANT: Respond primarily in ${settings.language === 'en' ? 'English' : settings.language === 'es' ? 'Spanish' : 'French'}.` 
        : '';
      
      const systemPrompt = `You are an expert financial analyst with access to complete QuickBooks data. 

CONTEXT: You have access to the user's entire QuickBooks account data including:
${knowledgeBase}

INSTRUCTIONS:
- Analyze the user's financial data to provide specific, actionable insights
- Reference actual numbers and trends from their QuickBooks data
- Provide professional financial advice based on their real business metrics
- Be specific about customers, vendors, accounts, and financial patterns you observe
- Suggest optimizations, identify risks, and highlight opportunities
- Keep responses conversational but professional
- Use markdown formatting for better readability${languageInstructions}

User Question: ${userMessage.content}`;
      const {
        data,
        error
      } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [{
            role: 'system',
            content: systemPrompt
          }, {
            role: 'user',
            content: userMessage.content
          }]
        }
      });
      if (error) throw error;

      // Detect if we should show a chart
      const chartType = detectChartType(userMessage.content);
      let chartData = null;
      if (chartType && hasIntegration) {
        chartData = {
          type: chartType,
          data: generateMockData(chartType),
          title: getChartTitle(chartType)
        };
      }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
        chartData
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setCurrentProcessingMessage('');
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  if (!integration) {
    return <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 text-vesta-navy-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-vesta-navy">Vesta Not Connected</h3>
          <p className="text-vesta-navy/80 text-sm leading-relaxed">
            Connect your QuickBooks account to start using Vesta for financial analysis.
          </p>
        </div>
      </div>;
  }
  return <div className="flex-1 flex flex-col h-screen bg-vesta-mist/25 text-vesta-navy">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (/* Welcome Screen */
      <div className="flex flex-col items-center justify-center min-h-screen px-8 pb-32">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <VestaBrand size="lg" className="text-vesta-navy" />
                <Sparkles className="w-6 h-6 text-vesta-navy/90" />
              </div>
              <h2 className="text-3xl font-medium mb-6 text-vesta-navy min-h-[3rem]">
                <TypingAnimation messages={cfoQuestions} className="text-vesta-navy" />
              </h2>
              <p className="text-vesta-navy/80 text-base max-w-xl mx-auto leading-relaxed">
                I'm Vesta, your AI financial analyst with access to your complete QuickBooks data for{' '}
                <span className="text-vesta-navy font-medium">{integration.company_name}</span>
              </p>
            </div>

            {/* Input Area - Centered */}
            <div className="w-full max-w-3xl">
              <div className="bg-white rounded-xl border border-vesta-navy/10 shadow-sm">
                <div className="flex items-center p-4">
                  {/* Model Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-vesta-navy/80 hover:text-vesta-navy hover:bg-vesta-mist/25 rounded-lg px-2 py-1 h-auto mr-3">
                        <span className="text-sm">
                          {models.find(m => m.id === selectedModel)?.icon}
                        </span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {models.map(model => <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)} className={selectedModel === model.id ? 'bg-vesta-mist/40' : ''}>
                          <span className="mr-2">{model.icon}</span>
                          <span className="font-medium">{model.name}</span>
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Input Field */}
                  <div className="flex-1 relative">
                    <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Message Vesta..." disabled={loading} className="min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent text-vesta-navy placeholder:text-vesta-navy-muted focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-6 shadow-none" rows={1} />
                  </div>
                  
                  {/* Right Side Actions */}
                  <div className="flex items-center gap-2 ml-3">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-vesta-mist/40 text-vesta-navy-muted hover:text-vesta-navy/80" disabled>
                      <Mic className="w-4 h-4" />
                    </Button>
                    
                    <Button onClick={handleSendMessage} disabled={loading || !input.trim()} size="sm" className="h-8 w-8 rounded-lg bg-vesta-navy p-0 text-white hover:bg-vesta-navy-muted/30 disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-vesta-navy/65 mt-3 text-center">
                Vesta can make mistakes. Always verify important information.
              </div>
            </div>
          </div>) : (/* Chat Messages */
      <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.map(message => <div key={message.id} className="mb-8">
                {message.role === 'user' ? <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-vesta-navy-muted/25 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">Y</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2 text-vesta-navy/90">You</div>
                      <div className="text-vesta-navy">
                        {message.content}
                      </div>
                    </div>
                  </div> : <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-vesta-navy-muted/30 flex items-center justify-center flex-shrink-0">
                      <VestaBrand size="sm" className="text-white" inline />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2 text-vesta-navy/90">Vesta</div>
                      
                      {/* Financial Chart */}
                      {message.chartData && <FinancialChart data={message.chartData.data} chartType={message.chartData.type} title={message.chartData.title} />}
                      
                      <div className="text-vesta-navy prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>}
              </div>)}
            
            {loading && <ThinkingAnimation userQuery={currentProcessingMessage} />}
            <div ref={messagesEndRef} />
          </div>)}
      </div>

      {/* Input Area for Chat Mode */}
      {messages.length > 0 && <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-vesta-navy/10 shadow-sm">
              <div className="flex items-center p-3">
                {/* Model Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-vesta-navy/80 hover:text-vesta-navy hover:bg-vesta-mist/25 rounded-lg px-2 py-1 h-auto mr-2">
                      <span className="text-sm">
                        {models.find(m => m.id === selectedModel)?.icon}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {models.map(model => <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model.id)} className={selectedModel === model.id ? 'bg-vesta-mist/40' : ''}>
                        <span className="mr-2">{model.icon}</span>
                        <span className="font-medium">{model.name}</span>
                      </DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Input Field */}
                <div className="flex-1 relative">
                  <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Message Vesta..." disabled={loading} className="min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent text-vesta-navy placeholder:text-vesta-navy-muted focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-6 shadow-none" rows={1} />
                </div>
                
                {/* Right Side Actions */}
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-vesta-mist/40 text-vesta-navy-muted hover:text-vesta-navy/80" disabled>
                    <Mic className="w-4 h-4" />
                  </Button>
                  
                  <Button onClick={handleSendMessage} disabled={loading || !input.trim()} size="sm" className="h-8 w-8 rounded-lg bg-vesta-navy p-0 text-white hover:bg-vesta-navy-muted/30 disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-vesta-navy/65 mt-2 text-center">
              Vesta can make mistakes. Always verify important information.
            </div>
          </div>
        </div>}
    </div>;
};
export default ChatGPTStyleChat;