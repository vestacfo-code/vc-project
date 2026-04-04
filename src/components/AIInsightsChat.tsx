import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import AIInsightsChatDialog from './AIInsightsChatDialog';
import AIDisclaimer from './AIDisclaimer';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import ValuationEstimatorDialog from '@/components/ValuationEstimator/ValuationEstimatorDialog';
import { CreditUsageWrapper } from './CreditUsageWrapper';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIInsightsChatProps {
  insights: string[];
  financialData: any;
  onInsightsUpdate?: (insights: string[]) => void;
}

const AIInsightsChat = ({ insights, financialData, onInsightsUpdate }: AIInsightsChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { requireTermsAcceptance } = useTermsAcceptance();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const generateFreshInsights = async () => {
    if (!user) return;
    
    // Check terms acceptance before proceeding
    if (!requireTermsAcceptance()) {
      return;
    }

    setIsGeneratingInsights(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'generate',
          financialData,
          profile,
        },
      });

      if (error) throw error;

      if (data?.insights && onInsightsUpdate) {
        onInsightsUpdate(data.insights);
        toast({
          title: "Insights Updated",
          description: "Fresh AI insights have been generated based on your latest data.",
        });

        // Auto-generate strategic alerts after fresh insights
        const { generateStrategicAlerts } = await import('@/lib/strategicAlertsHelper');
        const alertResult = await generateStrategicAlerts(user.id, false);
        
        if (alertResult.success && alertResult.alertsGenerated > 0) {
          toast({
            title: "Strategic Alerts Generated",
            description: `${alertResult.alertsGenerated} new strategic alerts are available in the Alerts tab.`,
          });
        }
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate fresh insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;
    
    // Check terms acceptance before proceeding
    if (!requireTermsAcceptance()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'chat',
          message: input,
          financialData,
          profile,
          currentInsights: insights
        }
      });

      if (error) {
        console.error('AI insights function error:', error);
        throw error;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data?.response || "I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add fallback AI message instead of just showing error toast
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I'm currently experiencing high demand and having trouble processing your question: "${input}". 

Based on your financial data, here are some general insights:
- Revenue: $${financialData?.totalRevenue?.toLocaleString() || 'N/A'}
- Profit: $${financialData?.profit?.toLocaleString() || 'N/A'}

Please try asking your question again in a few minutes for a more detailed response.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "AI Temporarily Unavailable",
        description: "I've provided a basic response above. Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (insights.length > 0) {
        // Open lightbox with the message
        setPendingMessage(input);
        setShowChatDialog(true);
        setInput('');
      } else {
        sendMessage();
      }
    }
  };

  const handleSendClick = () => {
    if (insights.length > 0) {
      // Open lightbox with the message
      setPendingMessage(input);
      setShowChatDialog(true);
      setInput('');
    } else {
      sendMessage();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg sm:text-xl">AI Insights</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <CreditUsageWrapper
              creditsRequired={1}
              actionName="Generate AI Insights"
              onAction={generateFreshInsights}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={isGeneratingInsights}
              >
                {isGeneratingInsights ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </CreditUsageWrapper>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowValuation(true)}
            >
              Estimate my valuation (beta)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          AI-powered financial insights {showChat && "and chat"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading Screen for Generating Insights */}
        {isGeneratingInsights && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Generating AI Insights...</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzing your financial data to provide personalized insights
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insights Display */}
        {!isGeneratingInsights && (
          <div className="space-y-3">
            {insights.length > 0 ? insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none prose-headings:text-primary prose-strong:text-primary prose-li:marker:text-primary">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-base font-semibold mb-2 text-primary">{children}</h1>,
                        h2: ({children}) => <h2 className="text-sm font-semibold mb-1 text-primary">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-medium mb-1 text-primary">{children}</h3>,
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-2 last:mb-0">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-2 last:mb-0">{children}</ol>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-primary">{children}</strong>,
                        em: ({children}) => <em className="italic text-muted-foreground">{children}</em>,
                      }}
                    >
                      {insight}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload financial data to get AI-powered insights about your business
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-2"
                  onClick={generateFreshInsights}
                  disabled={isGeneratingInsights}
                >
                  {isGeneratingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Chat Interface - Always show when there are insights */}
        {insights.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0 border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Chat with AI CFO</span>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            
            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 w-full border rounded-lg p-3">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    💬 Ask me about your financial insights or business strategy
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-2 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <Bot className="w-4 h-4 text-primary mt-1" />
                      )}
                      <div
                        className={`max-w-[85%] p-2 rounded-lg text-sm ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.type === 'ai' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      {message.type === 'user' && (
                        <User className="w-4 h-4 text-muted-foreground mt-1" />
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-start space-x-2">
                    <Bot className="w-4 h-4 text-primary mt-1" />
                    <div className="bg-muted p-2 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex items-center space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your financial insights..."
                className="flex-1"
                disabled={isLoading}
              />
              <CreditUsageWrapper
                creditsRequired={1}
                actionName="AI Chat Message"
                onAction={handleSendClick}
              >
                <Button
                  size="sm"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </CreditUsageWrapper>
            </div>
          </div>
        )}
      </CardContent>

      {/* Chat Dialog */}
      <AIInsightsChatDialog
        isOpen={showChatDialog}
        onClose={() => {
          setShowChatDialog(false);
          setPendingMessage('');
        }}
        insights={insights}
        financialData={financialData}
        initialMessage={pendingMessage}
      />

      {/* Valuation Estimator Dialog */}
      <ValuationEstimatorDialog
        isOpen={showValuation}
        onClose={() => setShowValuation(false)}
      />
    </Card>
  );
};

export default AIInsightsChat;