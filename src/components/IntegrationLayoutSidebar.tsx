import { useState, useEffect } from 'react';
  import { MessageSquare, Plus, Building2, MoreHorizontal, Edit, Trash2, BarChart3, RefreshCw, Check, X, Users, Package, FileText, DollarSign, LifeBuoy, UserCircle, TrendingUp, Search } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FinloBrand } from '@/components/ui/finlo-brand';
import { Badge } from '@/components/ui/badge';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useWaveIntegration } from '@/hooks/useWaveIntegration';
import { useZohoIntegration } from '@/hooks/useZohoIntegration';
import { useTeamRole } from '@/hooks/useTeamRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import finloLogo from '@/assets/finlo_full_logo_new.png';
import { useQuickBooksChat } from '@/hooks/useQuickBooksChat';
import { getAvailableIntegrations, getIntegrationConfig } from '@/config/integrations';
import { WaveButton } from '@/components/WaveButton';
import { ZohoButton } from '@/components/ZohoButton';
import QuickBooksButton from '@/components/QuickBooksButton';

import { Input } from '@/components/ui/input';
 import { useConsumerFeatures, AVAILABLE_FEATURES, FeatureKey } from '@/hooks/useConsumerFeatures';
 import SupportFormDrawer from '@/components/SupportFormDrawer';
 
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}
interface IntegrationLayoutSidebarProps {
  onNewChat: () => void;
  onSelectSession?: (sessionId: string) => void;
  currentSessionId?: string;
  onViewDashboard: () => void;
  currentView: 'chat' | 'dashboard' | 'pricing' | 'search' | 'market-trends';
}
const IntegrationLayoutSidebar = ({
  onNewChat,
  onSelectSession,
  currentSessionId,
  onViewDashboard,
  currentView
}: IntegrationLayoutSidebarProps) => {
  const {
    integration: qbIntegration,
    getStats,
    syncData,
    syncing,
    isMember,
    canSyncData
  } = useQuickBooksIntegration();
  const { integration: waveIntegration, syncData: waveSyncData, syncing: waveSyncing } = useWaveIntegration();
  const { integration: zohoIntegration, syncData: zohoSyncData, syncing: zohoSyncing } = useZohoIntegration();
  const { role: teamRole, isOwner: isTeamOwner } = useTeamRole();
  const { settings } = useSettings();
  const chatDark = settings.chatDarkMode;
  const { isMobile, setOpenMobile } = useSidebar();
  
  const closeMobileSheet = () => {
    if (isMobile) setOpenMobile(false);
  };
  
  const {
    toast
  } = useToast();
  const { conversations, loadConversations } = useQuickBooksChat();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('quickbooks');
  const [showConnectionDialog, setShowConnectionDialog] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
   
   // Load consumer features for custom solution users
   const { isCustomSolution, customLogo, getEnabledFeatures, hasFeature, loading: featuresLoading } = useConsumerFeatures();
   const enabledFeatures = getEnabledFeatures();
   const shouldHideDashboard = hasFeature('hide_dashboard');
    const [supportDrawerOpen, setSupportDrawerOpen] = useState(false);
   
   // Get icon for feature
   const getFeatureIcon = (featureKey: FeatureKey) => {
     switch (featureKey) {
       case 'crm': return <Users className="w-4 h-4" />;
       case 'inventory': return <Package className="w-4 h-4" />;
       case 'invoicing': return <FileText className="w-4 h-4" />;
       case 'payroll': return <DollarSign className="w-4 h-4" />;
       case 'reporting_advanced': return <BarChart3 className="w-4 h-4" />;
       default: return <BarChart3 className="w-4 h-4" />;
     }
   };
   
   // Use custom logo if available, otherwise default Finlo logo
   const displayLogo = customLogo || finloLogo;
  
  // Determine which integration to show based on what's connected
  const integration = selectedIntegration === 'quickbooks' ? qbIntegration 
    : selectedIntegration === 'wave' ? waveIntegration 
    : selectedIntegration === 'zoho' ? zohoIntegration 
    : null;
  
  // Convert conversations to chat sessions format
  const chatSessions: ChatSession[] = conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    lastMessage: '', // We'll keep this empty for now
    timestamp: new Date(conv.updated_at)
  }));

  // Reload conversations when component mounts and periodically
  useEffect(() => {
    loadConversations();
    
    // Set up periodic refresh to catch new conversations
    const interval = setInterval(loadConversations, 2000);
    
    return () => clearInterval(interval);
  }, []);
  const stats = getStats();
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };
  const handleSync = async () => {
    try {
      await syncData();
      toast({
        title: "Sync successful",
        description: "QuickBooks data has been updated"
      });
    } catch (error: any) {
      const isConnectionExpired = error.message?.includes('connection expired') || error.message?.includes('reconnect');
      toast({
        title: "Sync failed",
        description: isConnectionExpired ? "Your QuickBooks connection has expired. Please reconnect your account." : error.message || "Failed to sync QuickBooks data.",
        variant: "destructive",
        action: isConnectionExpired ? <Button variant="outline" size="sm" onClick={handleReconnect}>
            Reconnect
          </Button> : undefined
      });
    }
  };
  const handleReconnect = async () => {
    try {
      console.log('Starting QuickBooks reconnection...');

      // Get auth URL from our edge function
      const {
        data,
        error
      } = await supabase.functions.invoke('quickbooks-oauth', {
        body: {}
      });
      console.log('OAuth response:', {
        data,
        error
      });
      if (error) {
        console.error('OAuth function error:', error);
        throw new Error(error.message || 'Failed to get authorization URL');
      }
      if (!data?.authUrl) {
        console.error('No auth URL in response:', data);
        throw new Error(data?.error || 'No authorization URL received');
      }
      console.log('Opening OAuth popup with URL:', data.authUrl);

      // Open QuickBooks OAuth in a new window
      const popup = window.open(data.authUrl, 'quickbooks-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');

      // Listen for auth completion
      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === 'QB_AUTH_SUCCESS') {
          popup?.close();
          window.removeEventListener('message', messageListener);
          toast({
            title: "QuickBooks Reconnected!",
            description: "Successfully reconnected. Your data will sync shortly."
          });

          // Refresh the page to reload the integration
          window.location.reload();
        } else if (event.data?.type === 'QB_AUTH_ERROR') {
          popup?.close();
          window.removeEventListener('message', messageListener);
          toast({
            title: "Reconnection Failed",
            description: event.data?.error || 'Failed to reconnect to QuickBooks',
            variant: "destructive"
          });
        }
      };
      window.addEventListener('message', messageListener);

      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Reconnection Failed",
        description: error.message || "Failed to start reconnection process",
        variant: "destructive"
      });
    }
  };

  const handleIntegrationSwitch = (provider: string) => {
    const providerIntegration = provider === 'quickbooks' ? qbIntegration 
      : provider === 'wave' ? waveIntegration 
      : provider === 'zoho' ? zohoIntegration 
      : null;
    
    if (providerIntegration) {
      setSelectedIntegration(provider);
    } else {
      setShowConnectionDialog(provider);
    }
  };

  const handleConnectionSuccess = () => {
    setShowConnectionDialog(null);
    toast({
      title: "Connected successfully!",
      description: "Your integration is now active."
    });
    // Reload to refresh integrations
    window.location.reload();
  };

  const handleRename = async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast({
        title: "Invalid title",
        description: "Title cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('quickbooks_conversations')
        .update({ title: newTitle.trim() })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      await loadConversations();
      toast({ title: "Renamed successfully" });
      setRenamingId(null);
    } catch (error: any) {
      toast({ 
        title: "Rename failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      // Delete messages first
      await supabase
        .from('quickbooks_messages')
        .delete()
        .eq('conversation_id', sessionId);
      
      // Delete conversation
      const { error } = await supabase
        .from('quickbooks_conversations')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Clear current session if deleted
      if (currentSessionId === sessionId) {
        onNewChat();
      }
      
      await loadConversations();
      toast({ title: "Conversation deleted" });
    } catch (error: any) {
      toast({ 
        title: "Delete failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength 
      ? title.substring(0, maxLength) + '...' 
      : title;
  };

  return <Sidebar variant="floating" className={`w-64 rounded-xl border-0 ml-4 my-6 mb-6 max-h-[calc(100vh-3rem)] ${chatDark ? '[&_[data-sidebar=sidebar]]:border-[6px] [&_[data-sidebar=sidebar]]:border-[#1a1a1a] [&_[data-sidebar=sidebar]]:bg-[#111111]' : '[&_[data-sidebar=sidebar]]:border-[6px] [&_[data-sidebar=sidebar]]:border-white [&_[data-sidebar=sidebar]]:bg-white'}`}>
      <SidebarHeader className={`px-4 py-4 border-b ${chatDark ? 'border-sidebar-border' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
           {/* Show skeleton while loading to prevent logo flash */}
           {featuresLoading ? (
             <div className="h-8 w-[100px] bg-sidebar-foreground/10 rounded animate-pulse" />
           ) : (
             <img src={displayLogo} alt="Logo" className="h-8 w-auto object-contain max-w-[140px]" />
           )}
        </div>
        
        {/* Team Member Indicator */}
        {isMember && (
          <div className="mb-4 p-3 bg-sidebar-foreground/5 rounded-lg border border-sidebar-border">
            <div className="flex items-center gap-2 text-xs text-sidebar-muted-foreground">
              <UserCircle className="w-4 h-4" />
              <span className="capitalize">{teamRole || 'Member'}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <button onClick={() => { onNewChat(); closeMobileSheet(); }} className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'}`}>
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          
          {!shouldHideDashboard && (
            <button onClick={() => { onViewDashboard(); closeMobileSheet(); }} className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'} ${currentView === 'dashboard' ? (chatDark ? 'bg-sidebar-foreground/10 shadow-sm' : 'bg-blue-50 text-blue-700') : ''}`}>
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
          )}
           
           {/* Custom Solution Features - only render after loading completes */}
           {!featuresLoading && isCustomSolution && enabledFeatures.length > 0 && enabledFeatures.map((featureKey) => {
              // Skip control features that shouldn't appear as navigation items
              if (featureKey === 'hide_dashboard') return null;
              
              const feature = AVAILABLE_FEATURES.find(f => f.key === featureKey);
              if (!feature) return null;
             
              // Competitive Pricing is fully implemented - show both tabs
               if (featureKey === 'competitive_pricing') {
                 return (
                   <div key={featureKey} className="space-y-1">
                       <button 
                         onClick={() => { window.dispatchEvent(new CustomEvent('navigateToPricing')); closeMobileSheet(); }}
                        className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'} ${currentView === 'pricing' ? (chatDark ? 'bg-sidebar-foreground/10 shadow-sm' : 'bg-blue-50 text-blue-700') : ''}`}
                      >
                        <DollarSign className="w-4 h-4" />
                        Pricing Intelligence
                      </button>
                       <button 
                         onClick={() => { window.dispatchEvent(new CustomEvent('navigateToSearch')); closeMobileSheet(); }}
                        className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'} ${currentView === 'search' ? (chatDark ? 'bg-sidebar-foreground/10 shadow-sm' : 'bg-blue-50 text-blue-700') : ''}`}
                      >
                        <Search className="w-4 h-4" />
                        Product Search
                      </button>
                       <button 
                         onClick={() => { window.dispatchEvent(new CustomEvent('navigateToMarketTrends')); closeMobileSheet(); }}
                        className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'} ${currentView === 'market-trends' ? (chatDark ? 'bg-sidebar-foreground/10 shadow-sm' : 'bg-blue-50 text-blue-700') : ''}`}
                      >
                       <TrendingUp className="w-4 h-4" />
                       Market Trends
                     </button>
                   </div>
                 );
               }
             
             // Other features still coming soon
             return (
                <button 
                  key={featureKey}
                  className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium opacity-60 ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'}`}
                 title="Coming soon"
               >
                 {getFeatureIcon(featureKey)}
                 {feature.name}
                 <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4">Soon</Badge>
               </button>
             );
           })}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent">
        {integration && <SidebarGroup>
            <div className="flex items-center justify-between py-2">
            <SidebarGroupLabel className={`text-xs font-medium px-4 uppercase tracking-wide ${chatDark ? 'text-sidebar-muted-foreground' : 'text-gray-500'}`}>
                Connected Account
              </SidebarGroupLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-sidebar-foreground/10 rounded-md"
                    data-walkthrough="integration-dropdown"
                  >
                    <MoreHorizontal className="w-3 h-3 text-sidebar-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-48 shadow-lg z-50 ${chatDark ? 'bg-sidebar border border-sidebar-border' : 'bg-white border border-gray-200'}`}>
                  <div className="px-2 py-1.5 text-xs font-medium text-sidebar-muted-foreground border-b border-sidebar-border">
                    Switch Integration
                  </div>
                  {getAvailableIntegrations().map((integrationConfig) => {
                    const isConnected = integrationConfig.id === 'quickbooks' ? !!qbIntegration 
                      : integrationConfig.id === 'wave' ? !!waveIntegration 
                      : integrationConfig.id === 'zoho' ? !!zohoIntegration 
                      : false;
                    const isSelected = selectedIntegration === integrationConfig.id;
                    
                    return (
                      <DropdownMenuItem 
                        key={integrationConfig.id}
                        className={`text-sm py-2 cursor-pointer text-sidebar-foreground hover:!bg-sidebar-foreground/10 focus:!bg-sidebar-foreground/10 ${
                          integrationConfig.status !== 'active' ? 'text-sidebar-muted-foreground' : ''
                        }`}
                        onClick={() => integrationConfig.status === 'active' && handleIntegrationSwitch(integrationConfig.id)}
                        disabled={integrationConfig.status !== 'active'}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isConnected ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`} />
                          {integrationConfig.displayName} {isSelected && isConnected ? '(Current)' : isConnected ? '' : integrationConfig.status === 'coming-soon' ? '(Coming Soon)' : ''}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <SidebarGroupContent>
              {showConnectionDialog ? (
                <div className="mb-6 px-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Connect {showConnectionDialog}</span>
                      <Button 
                        onClick={() => setShowConnectionDialog(null)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <span className="text-lg">×</span>
                      </Button>
                    </div>
                    {showConnectionDialog === 'wave' && (
                      <WaveButton onConnected={handleConnectionSuccess} />
                    )}
                    {showConnectionDialog === 'zoho' && (
                      <ZohoButton onConnected={handleConnectionSuccess} />
                    )}
                    {showConnectionDialog === 'quickbooks' && (
                      <QuickBooksButton onConnected={handleConnectionSuccess} />
                    )}
                  </div>
                </div>
              ) : integration ? (
                <div className="mb-6 px-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sidebar-foreground font-medium text-sm">
                          {selectedIntegration === 'quickbooks' ? 'QuickBooks' 
                            : selectedIntegration === 'wave' ? 'Wave' 
                            : selectedIntegration === 'zoho' ? 'Zoho Books' 
                            : ''}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          (selectedIntegration === 'quickbooks' && qbIntegration?.is_active) ||
                          (selectedIntegration === 'wave' && waveIntegration?.is_active) ||
                          (selectedIntegration === 'zoho' && zohoIntegration?.is_active)
                            ? 'bg-emerald-500' 
                            : 'bg-red-500'
                        }`} />
                      </div>
                      
                      <Button 
                        onClick={() => {
                          if (selectedIntegration === 'quickbooks') handleSync();
                          else if (selectedIntegration === 'wave') waveSyncData();
                          else if (selectedIntegration === 'zoho') zohoSyncData();
                        }} 
                        disabled={
                          (selectedIntegration === 'quickbooks' && (syncing || (isMember && !canSyncData))) ||
                          (selectedIntegration === 'wave' && waveSyncing) ||
                          (selectedIntegration === 'zoho' && zohoSyncing)
                        } 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-sidebar-foreground/10 rounded-md" 
                        title={isMember && !canSyncData ? "You don't have permission to sync" : "Sync data"}
                      >
                        <RefreshCw className={`w-3 h-3 text-sidebar-muted-foreground ${
                          ((selectedIntegration === 'quickbooks' && syncing) ||
                           (selectedIntegration === 'wave' && waveSyncing) ||
                           (selectedIntegration === 'zoho' && zohoSyncing))
                            ? 'animate-spin' 
                            : ''
                        }`} />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-sidebar-muted-foreground">
                      {selectedIntegration === 'quickbooks' && qbIntegration?.company_name}
                      {selectedIntegration === 'wave' && waveIntegration?.business_name}
                      {selectedIntegration === 'zoho' && zohoIntegration?.organization_name}
                    </div>
                </div>
              ) : null}
            </SidebarGroupContent>
          </SidebarGroup>}

        {chatSessions.length > 0 && (
          <SidebarGroup className="flex-1 min-h-0 flex flex-col">
            <SidebarGroupLabel className={`text-xs font-medium px-4 py-2 uppercase tracking-wide sticky top-0 z-10 ${chatDark ? 'text-sidebar-muted-foreground bg-[#111111]' : 'text-gray-500 bg-white'}`}>
              Recent Chats
            </SidebarGroupLabel>
            <SidebarGroupContent className="relative flex-1 min-h-0 overflow-hidden">
              <div 
                className="h-full overflow-y-auto px-4 pb-16"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>{`
                  .sidebar-chat-scroll::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <SidebarMenu className="space-y-1 sidebar-chat-scroll">
                  <>
                    {chatSessions.map(session => (
                      <SidebarMenuItem key={session.id} className="relative">
                        {renamingId === session.id ? (
                          <div className="flex items-center gap-1 p-2">
                            <Input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRename(session.id, renameValue);
                                } else if (e.key === 'Escape') {
                                  setRenamingId(null);
                                }
                              }}
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleRename(session.id, renameValue)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setRenamingId(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative group">
                                <button 
                                  onClick={() => { onSelectSession?.(session.id); closeMobileSheet(); }} 
                                  className={`w-full p-2 rounded-lg transition-colors duration-150 border-0 text-left ${chatDark ? 'hover:bg-sidebar-foreground/10' : 'hover:bg-gray-100'} ${currentSessionId === session.id ? (chatDark ? 'bg-sidebar-foreground/10 shadow-sm' : 'bg-blue-50') : ''}`}
                                  title={session.title.length > 30 ? session.title : undefined}
                                >
                                  <div className="flex items-center pr-6">
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-medium truncate ${chatDark ? 'text-sidebar-foreground' : 'text-gray-800'}`}>
                                        {truncateTitle(session.title)}
                                      </div>
                                      <div className={`text-xs mt-1 ${chatDark ? 'text-sidebar-muted-foreground' : 'text-gray-500'}`}>
                                        {formatTimeAgo(session.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                            
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 h-6 w-6 hover:bg-sidebar-foreground/10" 
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-3 h-3 text-sidebar-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem 
                                    className="text-xs cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenamingId(session.id);
                                      setRenameValue(session.title);
                                    }}
                                  >
                                    <Edit className="w-3 h-3 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-xs text-red-600 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(session.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </>
                </SidebarMenu>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t pointer-events-none ${chatDark ? 'from-[#111111]' : 'from-white'} to-transparent`} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Support Button for All Users */}
      <SidebarFooter className={`px-4 py-4 border-t ${chatDark ? 'border-sidebar-border' : 'border-gray-200'}`}>
        <button
          onClick={() => { setSupportDrawerOpen(true); closeMobileSheet(); }}
          className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 border-0 transition-colors rounded-lg text-sm font-medium ${chatDark ? 'text-sidebar-foreground hover:bg-sidebar-foreground/10' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <LifeBuoy className="w-4 h-4" />
          Support
        </button>
      </SidebarFooter>
       
       <SupportFormDrawer open={supportDrawerOpen} onOpenChange={setSupportDrawerOpen} />
     </Sidebar>;
};
export default IntegrationLayoutSidebar;