import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings, Bell, Palette, Link, Calendar, Shield, User, Play, Upload, Edit3, Database, Download, LogOut, AlertCircle, Loader2, Check, CreditCard, Users, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { useTeamRole } from '@/hooks/useTeamRole';
import { NotificationPreferences } from './NotificationPreferences';
import WeeklyNotificationReport from './WeeklyEmailReport';
import { PlanCreditsTab } from './PlanCreditsTab';
import { CollaboratorsTab } from './CollaboratorsTab';
import { PermissionRestricted } from './settings/PermissionRestricted';
import { ProfileDataEditor } from './settings/ProfileDataEditor';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

const SettingsModal = ({ open, onOpenChange, defaultTab }: SettingsModalProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab || 'general');
  const { settings, updateSetting, isLoading, playVoice, exportData, deleteAccount, signOut } = useSettings();
  const { 
    isMember, 
    role, 
    canManagePlan, 
    canManageIntegrations, 
    canManageSchedules, 
    canManageMembers 
  } = useTeamRole();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

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
            <h2 className="font-serif text-2xl text-slate-900 mb-6">General</h2>
            
            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Theme</label>
                </div>
                <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                  <SelectTrigger className="w-32 h-8 text-sm border-slate-200 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                    <SelectItem value="system" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">System (light)</SelectItem>
                    <SelectItem value="light" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accent Color */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Accent color</label>
                </div>
                <Select value={settings.accentColor} onValueChange={(value: any) => updateSetting('accentColor', value)}>
                  <SelectTrigger className="w-32 h-8 text-sm border-slate-200 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                    <SelectItem value="default" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Default</SelectItem>
                    <SelectItem value="blue" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Blue</SelectItem>
                    <SelectItem value="green" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Green</SelectItem>
                    <SelectItem value="purple" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Language</label>
                </div>
                <Select value={settings.language} onValueChange={(value: any) => updateSetting('language', value)}>
                  <SelectTrigger className="w-32 h-8 text-sm border-slate-200 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                    <SelectItem value="auto" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Auto-detect</SelectItem>
                    <SelectItem value="en" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">English</SelectItem>
                    <SelectItem value="es" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Spanish</SelectItem>
                    <SelectItem value="fr" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spoken Language */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-900">Spoken language</label>
                  </div>
                  <Select value={settings.spokenLanguage} onValueChange={(value: any) => updateSetting('spokenLanguage', value)}>
                    <SelectTrigger className="w-32 h-8 text-sm border-slate-200 bg-white text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="auto" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Auto-detect</SelectItem>
                      <SelectItem value="en" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">English</SelectItem>
                      <SelectItem value="es" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Spanish</SelectItem>
                      <SelectItem value="fr" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">French</SelectItem>
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
                  <label className="text-sm font-medium text-slate-900">Voice</label>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => playVoice(settings.voice)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                  <Select value={settings.voice} onValueChange={(value: any) => updateSetting('voice', value)}>
                    <SelectTrigger className="w-24 h-8 text-sm border-slate-200 bg-white text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                      <SelectItem value="spruce" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Spruce</SelectItem>
                      <SelectItem value="oak" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Oak</SelectItem>
                      <SelectItem value="birch" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Birch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Show Additional Models */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Show additional models</label>
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
            <h2 className="font-serif text-2xl text-slate-900 mb-6">Personalization</h2>
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
                        <label className="text-sm font-medium text-slate-900">Custom avatar</label>
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
                        className="border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-900">Display name</label>
                        <p className="text-xs text-slate-500">How your name appears to others</p>
                      </div>
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-9 w-40 border border-slate-200 bg-white text-slate-900"
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
                            className="h-9 border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50"
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
                          <span className="text-sm font-medium text-slate-900">
                            {userInfo?.fullName || 'Not set'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
              <div className="border-t border-slate-200" />

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
              description="You don't have permission to manage data connections. Contact the account owner."
              requiredRole="Super Administrator or Owner"
            />
          );
        }
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-slate-900 mb-6">Integrations</h2>
            <p className="text-sm text-slate-400 mb-4 max-w-xl">
              Vesta CFO connects to your property systems and data you provide—PMS (e.g. Mews, Cloudbeds, Oracle Opera), CSV imports, and manual metrics—not generic small-business accounting tools.
            </p>
            <p className="text-sm text-slate-500 mb-6 max-w-xl">
              Add or manage connections on the Integrations page in the app sidebar.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate('/integrations');
              }}
              className="bg-white text-black hover:bg-slate-200 border-transparent font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Open Integrations
            </Button>
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
            <h2 className="font-serif text-2xl text-slate-900 mb-6">Schedules</h2>
            <div className="space-y-6">
              <WeeklyNotificationReport />
            </div>
          </div>
        );

      case 'data-controls':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-slate-900 mb-6">Data controls</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Export data</label>
                  <p className="text-xs text-slate-500">Download all your financial data</p>
                </div>
                <Button variant="outline" size="sm" className="border border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Data retention</label>
                  <p className="text-xs text-slate-500">How long we keep your data</p>
                </div>
                <Select defaultValue="indefinite">
                  <SelectTrigger className="w-32 h-8 text-sm border-slate-200 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                    <SelectItem value="1year" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">1 year</SelectItem>
                    <SelectItem value="2years" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">2 years</SelectItem>
                    <SelectItem value="indefinite" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-slate-900 mb-6">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Two-factor authentication</label>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                </div>
                <Switch 
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900">Session timeout</label>
                  <p className="text-xs text-slate-500">Automatically log out after inactivity</p>
                </div>
                <Select value={settings.sessionTimeout} onValueChange={(value: any) => updateSetting('sessionTimeout', value)}>
                  <SelectTrigger className="h-8 w-20 border border-slate-200 bg-white text-sm text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 border border-slate-200 bg-white shadow-lg">
                    <SelectItem value="15" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">15m</SelectItem>
                    <SelectItem value="30" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">30m</SelectItem>
                    <SelectItem value="60" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">1h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <h2 className="font-serif text-2xl text-slate-900 mb-6">Account</h2>
            {isLoadingUser ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-900">Email</label>
                  <span className="text-sm text-slate-400">{userInfo?.email || 'Not available'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-900">Plan</label>
                  <span className="text-sm text-slate-400">
                    {userInfo?.tier === 'ceo' ? 'CFO' : userInfo?.tier === 'scale' ? 'Scale' : userInfo?.tier === 'founder' ? 'Founder' : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-900">Account created</label>
                  <span className="text-sm text-slate-400">
                    {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'Not available'}
                  </span>
                </div>
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          {/* Custom overlay with blur */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
 <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 mx-4 h-[90vh] max-w-[1100px] translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl md:mx-0 md:h-[700px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=open]:zoom-in-95">
          {/* Close Button - positioned in sidebar area to avoid overlap with content */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-3 top-3 z-10 h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 md:left-4 md:top-4 md:h-6 md:w-6"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5 md:w-4 md:h-4" />
        </Button>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Sidebar - Horizontal scroll on mobile, vertical on desktop */}
          <div className="w-full flex-shrink-0 overflow-hidden border-b border-slate-200 bg-vesta-cream md:w-64 md:rounded-l-xl md:border-b-0 md:border-r">
            <div className="p-3 md:p-4 md:pt-12 overflow-x-auto md:overflow-x-visible">
              <nav className="flex md:flex-col gap-1 md:space-y-1 min-w-max md:min-w-0">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors md:gap-3 md:text-sm ${
                        activeTab === item.id
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            {renderContent()}
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

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