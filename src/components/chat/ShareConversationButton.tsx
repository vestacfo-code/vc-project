import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareConversationButtonProps {
  conversationId: string | undefined;
  disabled?: boolean;
}

export const ShareConversationButton = ({ 
  conversationId,
  disabled 
}: ShareConversationButtonProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!conversationId) {
      toast({
        title: "No conversation to share",
        description: "Start a conversation first",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-conversation-share', {
        body: { conversationId }
      });

      if (error) throw error;

      const shareUrl = data.shareUrl;
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link to let others view your conversation",
      });

      setTimeout(() => setCopied(false), 2000);

    } catch (error: any) {
      console.error('Share error:', error);
      toast({
        title: "Share failed",
        description: error.message || "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      disabled={disabled || isSharing || !conversationId}
      className="h-8 w-8"
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
    </Button>
  );
};