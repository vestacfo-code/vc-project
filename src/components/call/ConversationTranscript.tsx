import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface ConversationTranscriptProps {
  messages: Message[];
  isCallActive: boolean;
}

export default function ConversationTranscript({ messages, isCallActive }: ConversationTranscriptProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Conversation Transcript
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          {isCallActive ? 'Live' : 'Call ended'}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4 pb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`flex-1 max-w-[80%] ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Start your call to see the conversation transcript</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}