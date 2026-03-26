import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getIntegrationConfig } from '@/config/integrations';

interface ZohoButtonProps {
  onConnected?: () => void;
  refreshIntegration?: () => void;
  variant?: 'default' | 'small';
}

export const ZohoButton = ({ onConnected, refreshIntegration, variant = 'default' }: ZohoButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const zoho = getIntegrationConfig('zoho');

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to connect Zoho Books",
          variant: "destructive",
        });
        return;
      }

      // Get authorization URL
      const { data: authData, error: authError } = await supabase.functions.invoke('zoho-oauth', {
        method: 'POST',
      });

      if (authError || !authData?.authUrl) {
        throw new Error('Failed to generate authorization URL');
      }

      // Open OAuth popup
      const popup = window.open(
        authData.authUrl,
        'Zoho OAuth',
        'width=600,height=700,scrollbars=yes'
      );

      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups to connect Zoho Books",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      // Listen for OAuth completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'zoho-oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          toast({
            title: "Connected successfully!",
            description: "Zoho Books is now connected. Syncing your data...",
          });

          // Trigger initial sync
          try {
            await supabase.functions.invoke('zoho-sync');
            toast({
              title: "Sync completed",
              description: "Your Zoho Books data has been synced successfully",
            });
          } catch (syncError) {
            console.error('Initial sync error:', syncError);
          }

          onConnected?.();
          refreshIntegration?.();
          setIsConnecting(false);
        } else if (event.data.type === 'zoho-oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          
          toast({
            title: "Connection failed",
            description: event.data.error || "Failed to connect Zoho Books",
            variant: "destructive",
          });
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing OAuth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Zoho connection error:', error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect Zoho Books",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant === 'small' ? 'outline' : 'default'}
      size={variant === 'small' ? 'sm' : 'default'}
      className={
        variant === 'small'
          ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-medium'
          : `w-full h-12 flex items-center justify-center gap-3 font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md ${zoho.colors.primary} ${zoho.colors.hover} ${zoho.colors.text}`
      }
    >
      {isConnecting ? (
        <>
          <Loader2 className={variant === 'small' ? 'w-3 h-3 mr-1 animate-spin' : 'w-5 h-5 animate-spin'} />
          <span>{variant === 'small' ? 'Connecting...' : 'Connecting to Zoho Books...'}</span>
        </>
      ) : variant === 'small' ? (
        'Connect'
      ) : (
        <>
          <img 
            src={zoho.logo} 
            alt="Zoho Books" 
            className="w-6 h-6 object-contain"
          />
          <span>Connect {zoho.displayName}</span>
        </>
      )}
    </Button>
  );
};
