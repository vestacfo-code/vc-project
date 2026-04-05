import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function SharedConversation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState('Shared Conversation');

  useEffect(() => {
    loadSharedConversation();
  }, [token]);

  const loadSharedConversation = async () => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    try {
      // Use secure edge function to validate token and get conversation
      const { data, error } = await supabase.functions.invoke('validate-share-token', {
        body: { token }
      });

      if (error || !data) {
        setError('Share link not found or expired');
        setLoading(false);
        return;
      }

      setConversationTitle(data.conversation.title);
      setMessages(
        data.conversation.messages.map((msg: any) => ({
          ...msg,
          role: msg.role as 'user' | 'assistant'
        }))
      );
    } catch (err: any) {
      console.error('Error loading shared conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {error}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This conversation is not available. It may have been deleted or the link has expired.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{conversationTitle}</h1>
            <p className="text-sm text-muted-foreground">Read-only shared conversation</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages in this conversation</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm prose-neutral max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}