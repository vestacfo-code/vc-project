import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2, Bot, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { CreditUsageWrapper } from './CreditUsageWrapper';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIInsightsChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  insights: string[];
  financialData: any;
  initialMessage?: string;
}

const AIInsightsChatDialog = ({ 
  isOpen, 
  onClose, 
  insights, 
  financialData, 
  initialMessage 
}: AIInsightsChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Send initial message when dialog opens
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleInitialMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const handleInitialMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages([userMessage]);
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'chat',
          message,
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
      console.error('Error sending initial message:', error);
      
      // Add fallback AI message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I'm currently experiencing high demand. Here's what I can tell you about your financial situation:

**Current Financial Overview:**
- Revenue: $${financialData?.totalRevenue?.toLocaleString() || 'N/A'}
- Expenses: $${financialData?.totalExpenses?.toLocaleString() || 'N/A'}
- Profit: $${financialData?.profit?.toLocaleString() || 'N/A'}

Your question: "${message}"

Please try asking again in a few minutes for a more detailed analysis.`,
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

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
      
      // Add fallback AI message
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
      sendMessage();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInput('');
    onClose();
  };

  return (
    <Dialog modal={false} open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <DialogTitle>AI CFO Chat</DialogTitle>
          </div>
          <DialogDescription>
            Chat with your AI CFO about your insights and business strategy
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 w-full border rounded-lg p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p>💬 Ask me about your financial insights or business strategy</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.type === 'ai' ? (
                        <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap prose-headings:text-foreground prose-strong:text-foreground">
                          <ReactMarkdown
                            components={{
                              h1: ({children}) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-semibold mb-1">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                              p: ({children}) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-2 last:mb-0">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-2 last:mb-0">{children}</ol>,
                              li: ({children}) => <li className="text-sm">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
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
              onAction={sendMessage}
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
      </DialogContent>
    </Dialog>
  );
};

export default AIInsightsChatDialog;