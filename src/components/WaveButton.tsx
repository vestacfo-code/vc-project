import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface WaveButtonProps {
  onConnected?: () => void;
  refreshIntegration?: () => void;
  variant?: 'default' | 'small';
}

export const WaveButton = ({ onConnected, refreshIntegration, variant = 'default' }: WaveButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to connect Wave Accounting",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('wave-oauth', {
        method: 'POST',
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('No auth URL received');

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.authUrl,
        'Wave OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      let checkInterval: number;
      const messageHandler = async (event: MessageEvent) => {
        if (event.data.type === 'WAVE_AUTH_SUCCESS') {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageHandler);
          
          toast({
            title: "Success!",
            description: "Wave Accounting connected successfully. Initiating data sync...",
          });

          await handleInitialSync();
          
          if (onConnected) onConnected();
          if (refreshIntegration) refreshIntegration();
          setIsConnecting(false);
        } else if (event.data.type === 'WAVE_AUTH_ERROR') {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
          toast({
            title: "Connection failed",
            description: event.data.error || "Failed to connect to Wave",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', messageHandler);

      checkInterval = window.setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
        }
      }, 500);

    } catch (error) {
      console.error('Wave connection error:', error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Wave",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleInitialSync = async () => {
    try {
      const { error } = await supabase.functions.invoke('wave-sync', {
        method: 'POST',
      });

      if (error) {
        console.error('Initial sync error:', error);
        toast({
          title: "Sync warning",
          description: "Connected successfully, but initial sync encountered an issue. You can manually sync from the dashboard.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Data synced!",
          description: "Your Wave data has been synced successfully.",
        });
      }
    } catch (error) {
      console.error('Initial sync error:', error);
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
          ? 'bg-white text-vesta-navy border-vesta-navy/15 hover:bg-vesta-mist/25 hover:border-vesta-navy/12 font-medium'
          : 'w-full h-12 flex items-center justify-center gap-3 font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md bg-[#266FE8] hover:bg-[#1E5BC0] text-white'
      }
    >
      {isConnecting ? (
        <>
          <Loader2 className={variant === 'small' ? 'w-3 h-3 mr-1 animate-spin' : 'w-5 h-5 animate-spin'} />
          {variant === 'small' ? 'Connecting...' : 'Connecting to Wave...'}
        </>
      ) : variant === 'small' ? (
        'Connect'
      ) : (
        <>
          <img 
            src="/assets/f696a542-4a44-40cb-9d65-77d88fa076ea.png" 
            alt="Wave logo"
            className="w-6 h-6 object-contain"
          />
          Connect Wave Accounting
        </>
      )}
    </Button>
  );
};
