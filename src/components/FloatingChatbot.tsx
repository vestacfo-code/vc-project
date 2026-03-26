import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Send, X, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  file?: {
    name: string;
    type: string;
    url: string;
  };
  timestamp: Date;
}

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Thanks for checking out our AI assistant!\n\nWhat can I help you with today? You can ask questions or upload files for analysis.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use the chat",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build language-aware system prompt
      const languageInstructions = settings.language !== 'auto' 
        ? `\n\nIMPORTANT: Respond primarily in ${settings.language === 'en' ? 'English' : settings.language === 'es' ? 'Spanish' : 'French'}.` 
        : '';
      
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          message: inputValue + languageInstructions,
          conversationHistory: messages.slice(-10)
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsLoading(true);

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `Uploaded file: ${file.name}`,
        file: {
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file)
        },
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      const { data, error } = await supabase.functions.invoke('openai-file-analysis', {
        body: {
          fileContent: base64,
          fileName: file.name,
          fileType: file.type
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'I analyzed your file, but encountered an issue providing a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('File upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Log more specific error information
      if (error.details) {
        console.error('Supabase error details:', error.details);
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I had trouble analyzing your file. Error: ${error.message || 'Unknown error'}. Please try again or contact support.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button - Temporarily Disabled */}
      {/* <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button> */}

      {/* Chat Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md h-[600px] p-0 bg-background border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by OpenAI</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.file && (
                      <div className="mb-2 p-2 bg-background/10 rounded-lg text-xs">
                        📎 {message.file.name}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-2 max-w-[80%]">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your message"
                  disabled={isLoading}
                  className="border-0 bg-muted focus-visible:ring-1 focus-visible:ring-ring rounded-xl"
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};