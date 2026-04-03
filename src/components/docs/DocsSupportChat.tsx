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
            <div className="relative rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-xl">
              <p className="whitespace-nowrap text-sm font-medium text-slate-900">Need help? Ask Ava! 👋</p>
              {/* Arrow pointing down - proper triangle shape */}
              <div 
                className="absolute -bottom-2 right-6 h-0 w-0"
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid rgb(226 232 240)',
                }}
              />
            </div>
          </div>
        )}
        
        {/* Glassmorphic chat button */}
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl sm:h-14 sm:w-14"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7ba3e8]/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <MessageCircle className="relative z-10 h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full animate-in flex-col overflow-hidden duration-300 fade-in-0 zoom-in-95 slide-in-from-bottom-4 sm:bottom-6 sm:right-6 sm:h-[520px] sm:w-[400px]">
      <div className="absolute inset-0 border-0 bg-white shadow-2xl sm:rounded-3xl sm:border sm:border-slate-200" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 pt-safe sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7ba3e8] to-[#5a8ad4] shadow-lg shadow-[#7ba3e8]/20 sm:h-10 sm:w-10">
              <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Ava from Vesta Support</h3>
              <p className="text-xs text-slate-500">Ask anything about Vesta</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}>
                  <div className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed prose-p:my-1 prose-strong:font-semibold prose-strong:text-slate-900 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4 prose-li:my-0.5 prose-li:marker:text-[#7ba3e8]">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  
                  {/* Docs Links */}
                  {message.links && message.links.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {message.links.map((link, index) => (
                        <Link
                          key={index}
                          to={link.href}
                          onClick={() => setIsOpen(false)}
                          className="group flex items-center gap-2 text-xs text-[#5a8ad4] transition-colors hover:text-[#7ba3e8]"
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
                <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500">
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
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-2.5">
          <a 
            href="mailto:support@vesta.ai"
            className="flex items-center justify-center gap-2 text-xs text-slate-500 transition-colors hover:text-[#7ba3e8]"
          >
            <Mail className="h-3.5 w-3.5" />
            Need human support? Email support@vesta.ai
          </a>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Vesta..."
                disabled={isTyping}
                className="h-11 rounded-xl border border-slate-200 bg-white pr-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#7ba3e8]/40"
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
