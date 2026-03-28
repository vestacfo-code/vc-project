import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getIntegrationConfig } from '@/config/integrations';

interface QuickBooksButtonProps {
  onConnected?: () => void;
  refreshIntegration?: () => void;
}

const QuickBooksButton = ({ onConnected, refreshIntegration }: QuickBooksButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Clear any previous OAuth state
      localStorage.removeItem('qb_oauth_success');
      localStorage.removeItem('qb_oauth_error');
      
      // Get auth URL from our edge function
      const { data, error } = await supabase.functions.invoke('quickbooks-oauth', {
        body: {}
      });

      console.log('QuickBooks OAuth response:', { data, error });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message || 'Failed to get authorization URL');
      }

      if (!data?.authUrl) {
        console.error('No auth URL in response:', data);
        throw new Error('No authorization URL received');
      }

      console.log('Opening QuickBooks OAuth popup with URL:', data.authUrl);

      // Open QuickBooks OAuth in a new window
      const popup = window.open(
        data.authUrl,
        'quickbooks-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open popup window. Please check your popup blocker settings.');
      }

      // Listen for auth completion via postMessage
      const messageListener = (event: MessageEvent) => {
        console.log('[QB Button] Received message:', {
          type: event.data?.type,
          origin: event.origin,
          companyName: event.data?.companyName
        });
        
        // Accept messages from Supabase functions domain and any valid app origin
        const validOrigins = [
          'https://godnomficzhjaclmvomh.supabase.co',
          'https://vesta.ai',
          'https://www.vesta.ai'
        ];
        
        // Accept from valid origins OR lovableproject.com preview URLs
        const isValidOrigin = event.origin.includes('.lovableproject.com') || 
                             validOrigins.includes(event.origin);
        
        if (!isValidOrigin) {
          console.log('[QB Button] Ignoring message from invalid origin:', event.origin);
          return;
        }
        
        console.log('[QB Button] Processing message from valid origin:', event.origin);
        
        if (event.data?.type === 'QB_AUTH_SUCCESS') {
          console.log('[QB Button] QuickBooks auth success detected via postMessage');
          cleanup();
          
          const companyName = event.data?.companyName || 'your company';
          
          toast({
            title: "QuickBooks Connected!",
            description: `Successfully connected to ${companyName}. Your financial data is now syncing.`,
          });

          // Wait a bit for database to complete write, then explicitly fetch
          setTimeout(async () => {
            console.log('[QB Button] Fetching updated integration data...');
            if (refreshIntegration) {
              await refreshIntegration();
            }
            handleInitialSync();
            if (onConnected) {
              onConnected();
            }
          }, 1000);
          
          setIsConnecting(false);
        } else if (event.data?.type === 'QB_AUTH_ERROR') {
          console.log('[QB Button] QuickBooks auth error via postMessage:', event.data?.error);
          cleanup();
          
          const errorMsg = event.data?.error || 'Unknown error occurred';
          
          toast({
            title: "Connection Failed",
            description: errorMsg,
            variant: "destructive",
          });
          
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', messageListener);

      // Fallback: Poll database to check if integration was saved
      const checkIntegrationStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('quickbooks_integrations')
            .select('company_name, created_at')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // If we find a very recent integration (within last 15 seconds), consider it successful
          if (data && new Date().getTime() - new Date(data.created_at).getTime() < 15000) {
            console.log('QuickBooks auth success detected via database check');
            cleanup();
            
            toast({
              title: "QuickBooks Connected!",
              description: `Successfully connected to ${data.company_name}. Your financial data is now syncing.`,
            });

            if (refreshIntegration) {
              await refreshIntegration();
            }
            handleInitialSync();
            onConnected?.();
            setIsConnecting(false);
          }
        } catch (error) {
          console.error('Error checking integration status:', error);
        }
      };

      // Check database every 2 seconds as fallback, run for longer
      const dbChecker = setInterval(checkIntegrationStatus, 2000);

      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          console.log('QuickBooks popup was closed manually');
          cleanup();
          setIsConnecting(false);
        }
      }, 1000);

      // Cleanup function to prevent memory leaks
      const cleanup = () => {
        clearInterval(checkClosed);
        clearInterval(dbChecker);
        window.removeEventListener('message', messageListener);
        popup?.close();
      };

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        if (isConnecting) {
          cleanup();
          toast({
            title: "Connection Timeout",
            description: "The connection attempt timed out. Please try again.",
            variant: "destructive",
          });
          setIsConnecting(false);
        }
      }, 300000); // 5 minutes

      // Store cleanup function for potential cancellation
      return () => {
        clearTimeout(timeout);
        cleanup();
      };

    } catch (error: any) {
      console.error('QuickBooks connection error:', error);
      
      // More specific error handling
      let errorMessage = "Failed to connect to QuickBooks. Please try again.";
      
      if (error.message?.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = "QuickBooks service is temporarily unavailable. Please try again in a moment.";
      } else if (error.message?.includes('credentials not configured')) {
        errorMessage = "QuickBooks integration is not properly configured. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleInitialSync = async () => {
    try {
      // Start initial data sync in the background
      await supabase.functions.invoke('quickbooks-sync', {
        body: { syncType: 'full' }
      });
      
      toast({
        title: "Syncing Your Data",
        description: "We're importing your QuickBooks data. This may take a few minutes.",
      });
    } catch (error) {
      console.error('Initial sync error:', error);
      // Don't show error toast for sync - the main connection succeeded
    }
  };

  const quickbooksConfig = getIntegrationConfig('quickbooks');

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full h-12 bg-[#2CA01C] hover:bg-[#228516] text-white font-medium flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting to QuickBooks...
          </>
        ) : (
          <>
            <img 
              src={quickbooksConfig.logo} 
              alt="QuickBooks logo"
              className="w-6 h-6 object-contain"
            />
            Connect QuickBooks
          </>
        )}
      </Button>
      
      {/* Temporary test button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate('/chat')}
        className="w-full h-10 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 text-sm flex items-center justify-center gap-2"
      >
        <TestTube className="w-4 h-4" />
        Test QuickBooks Page (Temporary)
      </Button>
    </div>
  );
};

export default QuickBooksButton;