import { useState, useEffect } from 'react';
import { X, Settings, Bell, Palette, Link, Calendar, Shield, User, Play, Upload, Edit3, Database, Download, LogOut, AlertCircle, Loader2, Check, CreditCard, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useWaveIntegration } from '@/hooks/useWaveIntegration';
import { useZohoIntegration } from '@/hooks/useZohoIntegration';
import { useTeamRole } from '@/hooks/useTeamRole';
import { WaveButton } from '@/components/WaveButton';
import { ZohoButton } from '@/components/ZohoButton';
import { NotificationPreferences } from './NotificationPreferences';
import WeeklyNotificationReport from './WeeklyEmailReport';
import { PlanCreditsTab } from './PlanCreditsTab';
import { CollaboratorsTab } from './CollaboratorsTab';
import { PermissionRestricted } from './settings/PermissionRestricted';
import { ProfileDataEditor } from './settings/ProfileDataEditor';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getAvailableIntegrations } from '@/config/integrations';
import { supabase } from '@/integrations/supabase/client';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

const SettingsModal = ({ open, onOpenChange, defaultTab }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || 'general');
  const { settings, updateSetting, isLoading, playVoice, exportData, deleteAccount, signOut } = useSettings();
  const { integration, disconnectIntegration, refreshAfterOAuth } = useQuickBooksIntegration();
  const { integration: waveIntegration, disconnectIntegration: disconnectWave } = useWaveIntegration();
  const { integration: zohoIntegration, disconnectIntegration: disconnectZoho } = useZohoIntegration();
  const { 
    isMember, 
    role, 
    canManagePlan, 
    canManageIntegrations, 
    canManageSchedules, 
    canManageMembers 
  } = useTeamRole();
  const { toast } = useToast();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const availableIntegrations = getAvailableIntegrations();

  // Update activeTab when defaultTab changes or modal opens
  useEffect(() => {
    if (open && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Listen for events to open settings modal to specific tab (e.g., from credit guard)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
        onOpenChange(true);
      }
    };
    window.addEventListener('openSettings', handler as EventListener);
    return () => window.removeEventListener('openSettings', handler as EventListener);
  }, [onOpenChange]);

  // Load user data when modal opens
  useEffect(() => {
    if (open) {
      loadUserInfo();
    }
  }, [open]);

  const loadUserInfo = async () => {
    setIsLoadingUser(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, creditsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_credits').select('tier').eq('user_id', user.id).single(),
      ]);

      setUserInfo({
        email: user.email,
        fullName: profileRes.data?.full_name,
        avatarUrl: profileRes.data?.avatar_url,
        tier: creditsRes.data?.tier || 'founder',
        createdAt: user.created_at,
      });
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleQuickBooksConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Clear any previous OAuth state
      localStorage.removeItem('qb_oauth_success');
      localStorage.removeItem('qb_oauth_error');
      
      // Get auth URL from our edge function
      const { data, error } = await supabase.functions.invoke('quickbooks-oauth', {
        body: {}
      });

      if (error) {
        throw new Error(error.message || 'Failed to get authorization URL');
      }

      if (!data?.authUrl) {
        throw new Error('No authorization URL received');
      }

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
        console.log('[Settings Modal] Received message:', {
          type: event.data?.type,
          origin: event.origin,
          companyName: event.data?.companyName
        });
        
        // Accept messages from Supabase functions domain and any valid app origin
        const validOrigins = [
          'https://qjgnbvrxpmspzfqlomjc.supabase.co',
          'https://vesta.ai',
          'https://www.vesta.ai'
        ];
        
        // Accept from valid origins OR lovableproject.com preview URLs
        const isValidOrigin = event.origin.includes('.lovableproject.com') || 
                             validOrigins.includes(event.origin);
        
        if (!isValidOrigin) {
          console.log('[Settings Modal] Ignoring message from invalid origin:', event.origin);
          return;
        }
        
        console.log('[Settings Modal] Processing message from valid origin:', event.origin);
        
        if (event.data?.type === 'QB_AUTH_SUCCESS') {
          console.log('[Settings Modal] QuickBooks auth success via postMessage');
          cleanup();
          
          const companyName = event.data?.companyName || 'your company';
          
          toast({
            title: "QuickBooks Connected!",
            description: `Successfully connected to ${companyName}. Your financial data is now syncing.`,
          });

          refreshAfterOAuth();
          setIsConnecting(false);
        } else if (event.data?.type === 'QB_AUTH_ERROR') {
          console.log('[Settings Modal] QuickBooks auth error via postMessage:', event.data?.error);
          cleanup();
          
          toast({
            title: "Connection Failed",
            description: event.data?.error || 'Unknown error occurred',
            variant: "destructive",
          });
          
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', messageListener);

      // Fallback: Poll database to check if integration was saved
      const checkIntegrationStatus = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase
            .from('quickbooks_integrations')
            .select('company_name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // If we find a very recent integration (within last 10 seconds), consider it successful
          if (data && new Date().getTime() - new Date(data.created_at).getTime() < 10000) {
            console.log('[Settings Modal] QuickBooks auth success detected via database check');
            cleanup();
            
            toast({
              title: "QuickBooks Connected!",
              description: `Successfully connected to ${data.company_name}. Your financial data is now syncing.`,
            });

            refreshAfterOAuth();
            setIsConnecting(false);
          }
        } catch (error) {
          console.error('[Settings Modal] Error checking integration status:', error);
        }
      };

      // Check database every 2 seconds as fallback
      const dbChecker = setInterval(checkIntegrationStatus, 2000);

      // Cleanup function to prevent memory leaks
      const cleanup = () => {
        clearInterval(checkClosed);
        clearInterval(dbChecker);
        window.removeEventListener('message', messageListener);
        popup?.close();
      };

      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          cleanup();
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const sidebarItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'plan-credits', label: 'Plan & Credits', icon: CreditCard },
    { id: 'collaborators', label: 'Collaborators', icon: Users },
    { id: 'personalization', label: 'Personalization', icon: Palette },
    { id: 'connectors', label: 'Integrations', icon: Link },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
    { id: 'data-controls', label: 'Data controls', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">General</h2>
            
            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Theme</label>
                </div>
                <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                  <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    <SelectItem value="system" className="text-slate-300 focus:bg-white/10 focus:text-white">System</SelectItem>
                    <SelectItem value="light" className="text-slate-300 focus:bg-white/10 focus:text-white">Light</SelectItem>
                    <SelectItem value="dark" className="text-slate-300 focus:bg-white/10 focus:text-white">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chat Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Chat dark mode</label>
                  <p className="text-xs text-slate-400 mt-0.5">Dark background on the chat welcome screen</p>
                </div>
                <Switch
                  checked={settings.chatDarkMode}
                  onCheckedChange={(checked) => updateSetting('chatDarkMode', checked)}
                />
              </div>

              {/* Accent Color */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Accent color</label>
                </div>
                <Select value={settings.accentColor} onValueChange={(value: any) => updateSetting('accentColor', value)}>
                  <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    <SelectItem value="default" className="text-slate-300 focus:bg-white/10 focus:text-white">Default</SelectItem>
                    <SelectItem value="blue" className="text-slate-300 focus:bg-white/10 focus:text-white">Blue</SelectItem>
                    <SelectItem value="green" className="text-slate-300 focus:bg-white/10 focus:text-white">Green</SelectItem>
                    <SelectItem value="purple" className="text-slate-300 focus:bg-white/10 focus:text-white">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Language</label>
                </div>
                <Select value={settings.language} onValueChange={(value: any) => updateSetting('language', value)}>
                  <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    <SelectItem value="auto" className="text-slate-300 focus:bg-white/10 focus:text-white">Auto-detect</SelectItem>
                    <SelectItem value="en" className="text-slate-300 focus:bg-white/10 focus:text-white">English</SelectItem>
                    <SelectItem value="es" className="text-slate-300 focus:bg-white/10 focus:text-white">Spanish</SelectItem>
                    <SelectItem value="fr" className="text-slate-300 focus:bg-white/10 focus:text-white">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spoken Language */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">Spoken language</label>
                  </div>
                  <Select value={settings.spokenLanguage} onValueChange={(value: any) => updateSetting('spokenLanguage', value)}>
                    <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                      <SelectItem value="auto" className="text-slate-300 focus:bg-white/10 focus:text-white">Auto-detect</SelectItem>
                      <SelectItem value="en" className="text-slate-300 focus:bg-white/10 focus:text-white">English</SelectItem>
                      <SelectItem value="es" className="text-slate-300 focus:bg-white/10 focus:text-white">Spanish</SelectItem>
                      <SelectItem value="fr" className="text-slate-300 focus:bg-white/10 focus:text-white">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-slate-500">
                  For best results, select the language you mainly speak. If it's not listed, it may still be supported via auto-detection.
                </p>
              </div>

              {/* Voice */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Voice</label>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-sm hover:bg-white/10 text-slate-300"
                    onClick={() => playVoice(settings.voice)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                  <Select value={settings.voice} onValueChange={(value: any) => updateSetting('voice', value)}>
                    <SelectTrigger className="w-24 h-8 text-sm bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                      <SelectItem value="spruce" className="text-slate-300 focus:bg-white/10 focus:text-white">Spruce</SelectItem>
                      <SelectItem value="oak" className="text-slate-300 focus:bg-white/10 focus:text-white">Oak</SelectItem>
                      <SelectItem value="birch" className="text-slate-300 focus:bg-white/10 focus:text-white">Birch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Show Additional Models */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Show additional models</label>
                </div>
                <Switch 
                  checked={settings.showAdditionalModels} 
                  onCheckedChange={(checked) => updateSetting('showAdditionalModels', checked)}
                />
              </div>
            </div>
          </div>
        );
      
      case 'plan-credits':
        // Only owner can manage plan/credits
        if (isMember && !canManagePlan) {
          return (
            <PermissionRestricted 
              title="Plan & Credits"
              description="You don't have permission to manage billing and credits. Contact the account owner to make changes."
              requiredRole="Account Owner"
            />
          );
        }
        return <PlanCreditsTab />;
      
      case 'collaborators':
        // Only owner and admins can manage collaborators
        if (isMember && !canManageMembers) {
          return (
            <PermissionRestricted 
              title="Collaborators"
              description="You don't have permission to manage team members. Contact an administrator to invite or remove members."
              requiredRole="Administrator or higher"
            />
          );
        }
        return <CollaboratorsTab />;
      
      case 'personalization':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">Personalization</h2>
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Profile</h3>
                {isLoadingUser ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white">Custom avatar</label>
                        <p className="text-xs text-slate-500">Upload a custom profile picture</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        id="avatar-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;

                            const fileExt = file.name.split('.').pop();
                            const fileName = `${user.id}/avatar.${fileExt}`;

                            const { error: uploadError } = await supabase.storage
                              .from('avatars')
                              .upload(fileName, file, { upsert: true });

                            if (uploadError) throw uploadError;

                            const { data: { publicUrl } } = supabase.storage
                              .from('avatars')
                              .getPublicUrl(fileName);

                            const { error: updateError } = await supabase
                              .from('profiles')
                              .update({ avatar_url: publicUrl })
                              .eq('user_id', user.id);

                            if (updateError) throw updateError;

                            toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
                            loadUserInfo();
                          } catch (error) {
                            console.error('Error uploading avatar:', error);
                            toast({ title: "Upload failed", description: "Failed to upload avatar.", variant: "destructive" });
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white">Display name</label>
                        <p className="text-xs text-slate-500">How your name appears to others</p>
                      </div>
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-9 w-40 bg-white/5 border-white/10 text-white"
                            placeholder="Enter your display name"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-9 bg-white text-black hover:bg-slate-200"
                            onClick={async () => {
                              if (!editedName.trim()) {
                                toast({ 
                                  title: "Invalid name", 
                                  description: "Display name cannot be empty.", 
                                  variant: "destructive" 
                                });
                                return;
                              }

                              try {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) return;

                                const { error } = await supabase
                                  .from('profiles')
                                  .update({ full_name: editedName.trim() })
                                  .eq('user_id', user.id);

                                if (error) throw error;

                                toast({ title: "Name updated", description: "Your display name has been updated." });
                                setIsEditingName(false);
                                loadUserInfo();
                              } catch (error) {
                                console.error('Error updating name:', error);
                                toast({ title: "Update failed", description: "Failed to update name.", variant: "destructive" });
                              }
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 bg-transparent text-slate-300 border-white/10 hover:bg-white/10"
                            onClick={() => {
                              setIsEditingName(false);
                              setEditedName(userInfo?.fullName || '');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">
                            {userInfo?.fullName || 'Not set'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={() => {
                              setEditedName(userInfo?.fullName || '');
                              setIsEditingName(true);
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Business Profile Editor */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Business Profile</h3>
                <p className="text-xs text-slate-500 -mt-2">
                  Edit the information you provided during onboarding
                </p>
                <ProfileDataEditor />
              </div>
            </div>
          </div>
        );

      case 'connectors':
        // Only owner and super_admin can manage integrations
        if (isMember && !canManageIntegrations) {
          return (
            <PermissionRestricted 
              title="Integrations"
              description="You don't have permission to connect or disconnect integrations. Contact the account owner to manage integrations."
              requiredRole="Super Administrator or Owner"
            />
          );
        }
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">Integrations</h2>
            <p className="text-sm text-slate-400 mb-6">
              Connect your accounting software to sync financial data and get AI-powered insights.
            </p>
            <div className="space-y-4">
              {availableIntegrations.map((integ) => {
                const isConnected = 
                  (integ.id === 'quickbooks' && integration) ||
                  (integ.id === 'wave' && waveIntegration) ||
                  (integ.id === 'zoho' && zohoIntegration);
                const isComingSoon = integ.status === 'coming-soon';
                
                return (
                  <div 
                    key={integ.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isConnected 
                        ? 'border-emerald-500/30 bg-emerald-500/10' 
                        : isComingSoon 
                        ? 'border-white/10 bg-white/5 opacity-60' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <img 
                          src={integ.logo} 
                          alt={`${integ.displayName} logo`}
                          className="w-10 h-10 object-contain"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-white">
                              {integ.displayName}
                            </h3>
                            {isConnected && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded-full font-medium">
                                Connected
                              </span>
                            )}
                            {isComingSoon && (
                              <span className="text-xs px-2 py-0.5 bg-slate-600 text-white rounded-full font-medium">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          {isConnected && (integration || waveIntegration || zohoIntegration) && (
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-300">
                                <span className="font-medium">Company:</span> {
                                  integ.id === 'quickbooks' ? integration?.company_name :
                                  integ.id === 'wave' ? waveIntegration?.business_name :
                                  integ.id === 'zoho' ? zohoIntegration?.organization_name :
                                  'Unknown'
                                }
                              </p>
                              <p className="text-xs text-slate-500">
                                Connected {new Date(
                                  integ.id === 'quickbooks' ? integration?.created_at :
                                  integ.id === 'wave' ? waveIntegration?.created_at :
                                  integ.id === 'zoho' ? zohoIntegration?.updated_at :
                                  new Date()
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        {isConnected ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              if (integ.id === 'quickbooks') {
                                setShowDisconnectDialog(true);
                              } else if (integ.id === 'wave') {
                                disconnectWave();
                                loadUserInfo();
                              } else if (integ.id === 'zoho') {
                                disconnectZoho();
                                loadUserInfo();
                              }
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 hover:border-red-500/50 font-medium bg-transparent"
                          >
                            Disconnect
                          </Button>
                        ) : isComingSoon ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled
                            className="bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
                          >
                            Coming Soon
                          </Button>
                        ) : integ.id === 'wave' ? (
                          <WaveButton onConnected={loadUserInfo} variant="small" />
                        ) : integ.id === 'zoho' ? (
                          <ZohoButton onConnected={loadUserInfo} variant="small" />
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isConnecting}
                            onClick={() => {
                              if (integ.id === 'quickbooks') {
                                handleQuickBooksConnect();
                              }
                            }}
                            className="bg-white text-black hover:bg-slate-200 border-transparent font-medium"
                          >
                            {isConnecting && integ.id === 'quickbooks' ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Continue without connection option */}
            {!integration && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Want to explore first?
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    You can continue without connecting an integration to see how Vesta works. Connect later to access your real financial data.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      sessionStorage.setItem('walkthrough_dismissed', 'true');
                      window.dispatchEvent(new Event('demoModeChanged'));
                      onOpenChange(false);
                      toast({
                        title: "Demo Mode",
                        description: "You can explore Vesta's features. Connect an integration anytime to access your financial data.",
                      });
                    }}
                    className="bg-white/5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 font-medium"
                  >
                    Continue without connection
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'schedules':
        // Only owner, super_admin, and admin can manage schedules
        if (isMember && !canManageSchedules) {
          return (
            <PermissionRestricted 
              title="Schedules"
              description="You don't have permission to manage notification schedules. Contact an administrator to modify these settings."
              requiredRole="Administrator or higher"
            />
          );
        }
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">Schedules</h2>
            <div className="space-y-6">
              <WeeklyNotificationReport />
            </div>
          </div>
        );

      case 'data-controls':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">Data controls</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Export data</label>
                  <p className="text-xs text-slate-500">Download all your financial data</p>
                </div>
                <Button variant="outline" size="sm" className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Data retention</label>
                  <p className="text-xs text-slate-500">How long we keep your data</p>
                </div>
                <Select defaultValue="indefinite">
                  <SelectTrigger className="w-32 h-8 text-sm bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    <SelectItem value="1year" className="text-slate-300 focus:bg-white/10 focus:text-white">1 year</SelectItem>
                    <SelectItem value="2years" className="text-slate-300 focus:bg-white/10 focus:text-white">2 years</SelectItem>
                    <SelectItem value="indefinite" className="text-slate-300 focus:bg-white/10 focus:text-white">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Two-factor authentication</label>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                </div>
                <Switch 
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Session timeout</label>
                  <p className="text-xs text-slate-500">Automatically log out after inactivity</p>
                </div>
                <Select value={settings.sessionTimeout} onValueChange={(value: any) => updateSetting('sessionTimeout', value)}>
                  <SelectTrigger className="w-20 h-8 text-sm bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    <SelectItem value="15" className="text-slate-300 focus:bg-white/10 focus:text-white">15m</SelectItem>
                    <SelectItem value="30" className="text-slate-300 focus:bg-white/10 focus:text-white">30m</SelectItem>
                    <SelectItem value="60" className="text-slate-300 focus:bg-white/10 focus:text-white">1h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-white mb-6">Account</h2>
            {isLoadingUser ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Email</label>
                  <span className="text-sm text-slate-400">{userInfo?.email || 'Not available'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Plan</label>
                  <span className="text-sm text-slate-400">
                    {userInfo?.tier === 'ceo' ? 'CFO' : userInfo?.tier === 'scale' ? 'Scale' : userInfo?.tier === 'founder' ? 'Founder' : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Account created</label>
                  <span className="text-sm text-slate-400">
                    {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'Not available'}
                  </span>
                </div>
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-white/5 text-white border-white/10 hover:bg-white/10"
                    onClick={signOut}
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Sign Out
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleDisconnect = async () => {
    console.log('[Settings Modal] Starting disconnect process');
    const success = await disconnectIntegration();
    
    if (success) {
      console.log('[Settings Modal] Disconnect successful, updating UI');
      
      toast({
        title: "Integration disconnected",
        description: "Your QuickBooks account has been disconnected.",
      });
      setShowDisconnectDialog(false);
      
      // Clear BOTH storage keys to show walkthrough again
      localStorage.removeItem('integration_walkthrough_dismissed');
      sessionStorage.removeItem('walkthrough_dismissed');
      window.dispatchEvent(new Event('demoModeChanged'));
      
      // Close modal - the realtime subscription should handle the refresh
      onOpenChange(false);
    } else {
      console.log('[Settings Modal] Disconnect failed');
      toast({
        title: "Error",
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          {/* Custom overlay with blur */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
 <DialogPrimitive.Content className="w-full max-w-[1100px] h-[90vh] md:h-[700px] p-0 gap-0 bg-[#0a0a0a] fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] rounded-xl overflow-hidden border border-white/10 shadow-2xl mx-4 md:mx-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close Button - positioned in sidebar area to avoid overlap with content */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 left-3 md:top-4 md:left-4 z-10 h-8 w-8 md:h-6 md:w-6 p-0 hover:bg-white/10 text-slate-400 hover:text-white focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5 md:w-4 md:h-4" />
        </Button>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Sidebar - Horizontal scroll on mobile, vertical on desktop */}
          <div className="w-full md:w-64 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-white/10 md:rounded-l-xl overflow-hidden flex-shrink-0">
            <div className="p-3 md:p-4 md:pt-12 overflow-x-auto md:overflow-x-visible">
              <nav className="flex md:flex-col gap-1 md:space-y-1 min-w-max md:min-w-0">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === item.id
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline md:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#0a0a0a]">
            {renderContent()}
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

    {/* Disconnect Confirmation Dialog */}
    <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Disconnect QuickBooks?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will disconnect your QuickBooks integration. Your chat history will be preserved, but you won't be able to access real-time financial data until you reconnect.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700"
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Account Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Delete Account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              deleteAccount();
              setShowDeleteDialog(false);
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default SettingsModal;