import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { supabase } from '@/integrations/supabase/client';
import { useConsumerFeatures } from '@/hooks/useConsumerFeatures';

import { useDashboardReference } from '@/contexts/DashboardReferenceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, MessageSquare, Database, RefreshCw, User, Settings, Sparkles, CreditCard, Users, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import IntegrationLayoutSidebar from '@/components/IntegrationLayoutSidebar';
import IntegrationChat from '@/components/IntegrationChat';
import IntegrationDashboard from '@/components/IntegrationDashboard';
import { CompetitivePricingDashboard, VarianceAnalysisDashboard, MarketTrendDashboard } from '@/components/pricing';
import QuickBooksButton from '@/components/QuickBooksButton';
import { IntegrationButton } from '@/components/IntegrationButton';
import { getAvailableIntegrations, getIntegrationConfig } from '@/config/integrations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import SettingsModal from '@/components/SettingsModal';
import { TrialCountdown } from '@/components/TrialCountdown';
import { useSettings } from '@/contexts/SettingsContext';
import { PersistentChatBar } from '@/components/PersistentChatBar';

const ChatHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0); // Key to force IntegrationChat remount
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard' | 'pricing' | 'search' | 'market-trends'>('chat');
  const [testMode, setTestMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<string>('general');
  const [showUpgrade, setShowUpgrade] = useState(true);
  const { integration, loading, refreshAfterOAuth } = useQuickBooksIntegration();
  const { setAvailableReferences, pendingReference } = useDashboardReference();
  const { hasFeature } = useConsumerFeatures();
  
  // Load available references for the mention dropdown
  useEffect(() => {
    const references = [
      { id: 'cash-flow', name: 'Cash Flow Forecast', type: 'Financial Metric', icon: 'trending-up', data: 'Cash flow forecast data' },
      { id: 'ar-intelligence', name: 'AR Intelligence', type: 'Financial Metric', icon: 'dollar-sign', data: 'AR data' },
      { id: 'expense-analysis', name: 'Expense Intelligence', type: 'Financial Metric', icon: 'bar-chart', data: 'Expense data' },
      { id: 'customer-profitability', name: 'Customer Profitability', type: 'Financial Metric', icon: 'users', data: 'Customer data' },
      { id: 'cash-flow-chart', name: 'Cash Flow Projection', type: 'Chart', icon: 'trending-up', data: 'Cash flow chart' },
      { id: 'customer-revenue-chart', name: 'Customer Revenue', type: 'Chart', icon: 'users', data: 'Revenue chart' },
      { id: 'expense-breakdown-chart', name: 'Expense Distribution', type: 'Chart', icon: 'bar-chart', data: 'Expense chart' },
    ];
    
    // Add pricing references if feature is enabled
    if (hasFeature('competitive_pricing')) {
      references.push(
        { id: 'pricing-overview', name: 'Pricing Overview', type: 'Pricing Cockpit', icon: 'trending-up', data: 'Competitive pricing summary' },
        { id: 'pricing-variance', name: 'Price Variance Analysis', type: 'Pricing Cockpit', icon: 'bar-chart', data: 'SKU-level price variance' }
      );
    }
    
    setAvailableReferences(references);
  }, [integration, setAvailableReferences, hasFeature]);

  // Listen for navigate to chat events (from pricing dashboard)
  useEffect(() => {
    const handleNavigateToChat = () => setCurrentView('chat');
    const handleNavigateToPricing = () => setCurrentView('pricing');
    const handleNavigateToSearch = () => setCurrentView('search');
    const handleNavigateToMarketTrends = () => setCurrentView('market-trends');
    
    window.addEventListener('navigateToChat', handleNavigateToChat);
    window.addEventListener('navigateToPricing', handleNavigateToPricing);
    window.addEventListener('navigateToSearch', handleNavigateToSearch);
    window.addEventListener('navigateToMarketTrends', handleNavigateToMarketTrends);
    
    return () => {
      window.removeEventListener('navigateToChat', handleNavigateToChat);
      window.removeEventListener('navigateToPricing', handleNavigateToPricing);
      window.removeEventListener('navigateToSearch', handleNavigateToSearch);
      window.removeEventListener('navigateToMarketTrends', handleNavigateToMarketTrends);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

   // Check if user should see upgrade button
   useEffect(() => {
     const checkUpgradeVisibility = async () => {
       if (!user) return;
       
       const [profileRes, creditsRes] = await Promise.all([
         supabase.from('profiles').select('is_custom_solution').eq('user_id', user.id).single(),
         supabase.from('user_credits').select('tier').eq('user_id', user.id).single()
       ]);
       
       const isCustomSolution = profileRes.data?.is_custom_solution;
       const tier = creditsRes.data?.tier;
       
       // Hide upgrade for custom solutions or paid plans (scale/ceo)
       if (isCustomSolution || tier === 'scale' || tier === 'ceo') {
         setShowUpgrade(false);
       }
     };
     
     checkUpgradeVisibility();
   }, [user]);
 
  // Auto-switch to chat view when a dashboard reference is clicked
  useEffect(() => {
    if (pendingReference) {
      setCurrentView('chat');
    }
  }, [pendingReference]);

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
    setChatKey(prev => prev + 1); // Increment key to force component remount
    setCurrentView('chat');
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentView('chat');
  };

  const handleViewDashboard = () => {
    setCurrentView('dashboard');
  };

  // Don't block the UI while loading integration - show chat immediately
  // The IntegrationChat component handles its own loading states

  return (
    <SidebarProvider>
      <ChatHubContent 
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        currentSessionId={currentSessionId}
        chatKey={chatKey}
        onViewDashboard={handleViewDashboard}
        currentView={currentView}
        showUpgrade={showUpgrade}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        settingsDefaultTab={settingsDefaultTab}
        setSettingsDefaultTab={setSettingsDefaultTab}
        setCurrentView={setCurrentView}
        navigate={navigate}
      />
    </SidebarProvider>
  );
};

// Separate component to use useSidebar hook inside SidebarProvider
interface ChatHubContentProps {
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
  chatKey: number;
  onViewDashboard: () => void;
  currentView: 'chat' | 'dashboard' | 'pricing' | 'search' | 'market-trends';
  showUpgrade: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  settingsDefaultTab: string;
  setSettingsDefaultTab: (tab: string) => void;
  setCurrentView: (view: 'chat' | 'dashboard' | 'pricing' | 'search' | 'market-trends') => void;
  navigate: (path: string) => void;
}

const ChatHubContent = ({
  onNewChat,
  onSelectSession,
  currentSessionId,
  chatKey,
  onViewDashboard,
  currentView,
  showUpgrade,
  settingsOpen,
  setSettingsOpen,
  settingsDefaultTab,
  setSettingsDefaultTab,
  setCurrentView,
  navigate
}: ChatHubContentProps) => {
  const { toggleSidebar, isMobile } = useSidebar();
  const { settings } = useSettings();
  const chatDark = settings.chatDarkMode;

  // Set sidebar CSS variables on root so mobile Sheet portals inherit correct theme
  useEffect(() => {
    const root = document.documentElement;
    if (!chatDark) {
      root.style.setProperty('--sidebar-background', '0 0% 100%');
      root.style.setProperty('--sidebar-foreground', '222 47% 11%');
      root.style.setProperty('--sidebar-primary', '221 83% 53%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-accent', '210 17% 95%');
      root.style.setProperty('--sidebar-accent-foreground', '222 47% 11%');
      root.style.setProperty('--sidebar-border', '220 13% 91%');
      root.style.setProperty('--sidebar-ring', '221 83% 53%');
    } else {
      // Dark mode — match #111111 bg, #1a1a1a borders
      root.style.setProperty('--sidebar-background', '0 0% 6.7%');
      root.style.setProperty('--sidebar-foreground', '0 0% 89%');
      root.style.setProperty('--sidebar-primary', '221 70% 58%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 6.7%');
      root.style.setProperty('--sidebar-accent', '0 0% 10%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 89%');
      root.style.setProperty('--sidebar-border', '0 0% 10.2%');
      root.style.setProperty('--sidebar-ring', '221 70% 58%');
    }
    return () => {
      // Clean up on unmount
      const vars = ['--sidebar-background', '--sidebar-foreground', '--sidebar-primary', '--sidebar-primary-foreground', '--sidebar-accent', '--sidebar-accent-foreground', '--sidebar-border', '--sidebar-ring'];
      vars.forEach(v => root.style.removeProperty(v));
    };
  }, [chatDark]);
  
  const handlePersistentChatSubmit = (text: string) => {
    setCurrentView('chat');
    // Dispatch event so IntegrationChat can pick up the initial message with page context
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('persistentChatMessage', { detail: { text, pageContext: currentView } }));
    }, 100);
  };
  
  return (
    <div className={`flex h-[100dvh] w-full ${chatDark ? 'bg-[#0a0a0a] text-white' : 'text-zinc-900'}`} style={chatDark ? undefined : { backgroundColor: '#f8f4f1' }}>
      {/* Always show main layout - walkthrough will guide users */}
      <>
        <IntegrationLayoutSidebar
            onNewChat={onNewChat}
            onSelectSession={onSelectSession}
            currentSessionId={currentSessionId}
            onViewDashboard={onViewDashboard}
            currentView={currentView}
          />
          
          <div className={`flex-1 flex flex-col relative overflow-hidden ${chatDark ? 'bg-[#0a0a0a]' : ''}`}>
            {/* Mobile Header */}
            <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40 ${chatDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-100'}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={toggleSidebar}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                {showUpgrade && (
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openSettings', { 
                        detail: { tab: 'plan-credits' } 
                      }));
                    }}
                    size="sm"
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs border-0"
                  >
                    Upgrade
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 rounded-full border transition-all duration-150 shadow-sm ${chatDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-400 hover:bg-[#2a2a2a] hover:text-white' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 hover:text-gray-900'}`}
                    >
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className={`w-48 ${chatDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={chatDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} />
                    <DropdownMenuItem onClick={() => {
                      setSettingsDefaultTab('general');
                      setSettingsOpen(true);
                    }} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Desktop Top Menu */}
            <div className="hidden md:flex absolute top-4 right-4 z-50 items-center gap-2">
               {showUpgrade && (
                 <Button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openSettings', { 
                    detail: { tab: 'plan-credits' } 
                  }));
                }}
                size="sm"
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm border-0 shadow-sm"
              >
                Upgrade
              </Button>
               )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 rounded-full border transition-all duration-150 shadow-sm ${chatDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-400 hover:bg-[#2a2a2a] hover:text-white' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 hover:text-gray-900'}`}
                    >
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-48 ${chatDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('chat')} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('dashboard')} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                    <Database className="w-4 h-4 mr-2" />
                    Dashboard View
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={chatDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} />
                  <DropdownMenuItem onClick={() => {
                    setSettingsDefaultTab('collaborators');
                    setSettingsOpen(true);
                  }} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                    <Users className="w-4 h-4 mr-2" />
                    Collaborators
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSettingsDefaultTab('plan-credits');
                    setSettingsOpen(true);
                  }} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSettingsDefaultTab('general');
                    setSettingsOpen(true);
                  }} className={chatDark ? 'text-zinc-200 hover:bg-white/5 focus:bg-white/5 focus:text-white' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Main Content */}
            {currentView === 'chat' ? (
              <IntegrationChat key={chatKey} conversationId={currentSessionId} />
            ) : (
              <div className={`relative flex-1 flex flex-col overflow-hidden ${chatDark ? 'dark-mode-cards' : ''}`}>
                <div className="flex-1 overflow-y-auto pb-24">
                  {currentView === 'pricing' ? (
                    <VarianceAnalysisDashboard />
                  ) : currentView === 'search' ? (
                    <CompetitivePricingDashboard />
                  ) : currentView === 'market-trends' ? (
                    <MarketTrendDashboard />
                  ) : (
                    <IntegrationDashboard />
                  )}
                </div>
                <PersistentChatBar onSubmit={handlePersistentChatSubmit} darkMode={chatDark} />
              </div>
            )}
        </div>
      </>
      
      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsDefaultTab} />
      
      {/* Trial Countdown */}
      <TrialCountdown />
    </div>
  );
};

export default ChatHub;