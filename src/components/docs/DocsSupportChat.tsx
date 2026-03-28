import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  links?: { title: string; href: string }[];
  timestamp: Date;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DocsSupportChatProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DocsSupportChat = ({ isOpen: externalIsOpen, onOpenChange }: DocsSupportChatProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // Hide tooltip after 5 seconds or when chat is opened
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) setShowTooltip(false);
  }, [isOpen]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm Ava from Vesta Support 👋\n\nI'm here to help you navigate Vesta's documentation and answer any questions about our platform. Ask me about features, setup, pricing, or troubleshooting!\n\nNeed human support? Email us at support@vesta.ai",
      links: [
        { title: 'Quick Tour', href: '/docs/getting-started/tour' },
        { title: 'FAQ', href: '/docs/learn/faq' }
      ],
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory: ConversationMessage[] = messages
        .filter(m => m.id !== '1') // Exclude initial greeting
        .map(m => ({
          role: m.type as 'user' | 'assistant',
          content: m.content
        }));

      const { data, error } = await supabase.functions.invoke('docs-support-chat', {
        body: { 
          message: messageText,
          conversationHistory 
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that. Please try again or email support@vesta.ai.",
        links: data.links || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or email support@vesta.ai for assistance.",
        links: [{ title: 'FAQ', href: '/docs/learn/faq' }],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        {/* Tooltip pointer */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 animate-fade-in">
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-2.5 shadow-xl">
              <p className="text-white text-sm font-medium whitespace-nowrap">Need help? Ask Ava! 👋</p>
              {/* Arrow pointing down - proper triangle shape */}
              <div 
                className="absolute -bottom-2 right-6 w-0 h-0"
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          </div>
        )}
        
        {/* Glassmorphic chat button */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl shadow-black/20 hover:shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        >
          {/* Inner gradient glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7ba3e8]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[100dvh] sm:h-[520px] z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
      {/* Glassmorphism container */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl sm:rounded-3xl border-0 sm:border border-white/20 shadow-2xl shadow-black/40" />
      
      {/* Inner glow effect */}
      <div className="absolute inset-[1px] sm:rounded-[23px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 pt-safe">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-[#7ba3e8] to-[#5a8ad4] flex items-center justify-center shadow-lg shadow-[#7ba3e8]/20">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Ava from Vesta Support</h3>
              <p className="text-xs text-white/50">Ask anything about Vesta</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="h-9 w-9 text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/10 flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-[#7ba3e8] to-[#5a8ad4] text-white shadow-lg shadow-[#7ba3e8]/20' 
                    : 'bg-white/10 backdrop-blur-sm text-white/90 border border-white/10'
                }`}>
                  <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white prose-strong:font-semibold prose-ul:my-2 prose-ul:pl-4 prose-ul:list-disc prose-ol:my-2 prose-ol:pl-4 prose-ol:list-decimal prose-li:my-0.5 prose-li:marker:text-[#7ba3e8]">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  
                  {/* Docs Links */}
                  {message.links && message.links.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {message.links.map((link, index) => (
                        <Link
                          key={index}
                          to={link.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 text-xs text-[#7ba3e8] hover:text-white transition-colors group"
                        >
                          <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform" />
                          {link.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-sm text-white/60 rounded-2xl px-4 py-3 max-w-[80%] border border-white/10">
                  <div className="flex items-center gap-1.5">
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

        {/* Email Support Banner */}
        <div className="px-5 py-2.5 border-t border-white/10 bg-white/[0.02]">
          <a 
            href="mailto:support@vesta.ai"
            className="flex items-center justify-center gap-2 text-xs text-white/40 hover:text-[#7ba3e8] transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Need human support? Email support@vesta.ai
          </a>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Vesta..."
                disabled={isTyping}
                className="border-0 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-[#7ba3e8]/50 rounded-xl h-11 pr-4"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
              className="h-11 w-11 bg-gradient-to-br from-[#7ba3e8] to-[#5a8ad4] hover:from-[#6a92d7] hover:to-[#4a7ac4] text-white rounded-xl shrink-0 shadow-lg shadow-[#7ba3e8]/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsSupportChat;
