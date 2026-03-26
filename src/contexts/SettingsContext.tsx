import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SettingsState {
  theme: 'system' | 'light' | 'dark';
  accentColor: 'default' | 'blue' | 'green' | 'purple';
  language: 'auto' | 'en' | 'es' | 'fr';
  spokenLanguage: 'auto' | 'en' | 'es' | 'fr';
  voice: 'spruce' | 'oak' | 'birch';
  showAdditionalModels: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  monthlySummaries: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: '15' | '30' | '60';
  dataRetentionDays: number;
  exportFormat: 'json' | 'csv';
  chatDarkMode: boolean;
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => Promise<void>;
  isLoading: boolean;
  playVoice: (voice: string) => void;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultSettings: SettingsState = {
  theme: 'system',
  accentColor: 'default',
  language: 'auto',
  spokenLanguage: 'auto',
  voice: 'spruce',
  showAdditionalModels: true,
  emailNotifications: true,
  pushNotifications: false,
  weeklyReports: true,
  monthlySummaries: false,
  twoFactorAuth: false,
  sessionTimeout: '30',
  dataRetentionDays: 365,
  exportFormat: 'json',
  chatDarkMode: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load settings from database on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-logout based on session timeout
  useEffect(() => {
    if (!settings.sessionTimeout) return;
    
    const timeout = parseInt(settings.sessionTimeout) * 60 * 1000; // Convert to milliseconds
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    const handleSessionExpired = async () => {
      if (!isMounted) return; // Don't execute if component unmounted
      
      try {
        await supabase.auth.signOut();
        navigate('/auth');
        toast({
          title: "Session expired",
          description: "You've been logged out due to inactivity.",
        });
      } catch (error) {
        console.error('Error during auto-logout:', error);
      }
    };
    
    const resetTimer = () => {
      if (!isMounted) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSessionExpired, timeout);
    };
    
    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [settings.sessionTimeout, navigate]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
      }

      if (data) {
        const loadedSettings: SettingsState = {
          theme: data.theme as SettingsState['theme'],
          accentColor: data.accent_color as SettingsState['accentColor'],
          language: data.language as SettingsState['language'],
          spokenLanguage: data.spoken_language as SettingsState['spokenLanguage'],
          voice: data.voice as SettingsState['voice'],
          showAdditionalModels: data.show_additional_models,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          weeklyReports: data.weekly_reports,
          monthlySummaries: data.monthly_summaries,
          twoFactorAuth: data.two_factor_auth,
          sessionTimeout: data.session_timeout as SettingsState['sessionTimeout'],
          dataRetentionDays: data.data_retention_days,
          exportFormat: data.export_format as SettingsState['exportFormat'],
          chatDarkMode: data.chat_dark_mode ?? true,
        };
        setSettings(loadedSettings);
        applyTheme(loadedSettings.theme);
        applyAccentColor(loadedSettings.accentColor);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistSettings = async (newSettings: SettingsState) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = {
        user_id: user.id,
        theme: newSettings.theme,
        accent_color: newSettings.accentColor,
        language: newSettings.language,
        spoken_language: newSettings.spokenLanguage,
        voice: newSettings.voice,
        show_additional_models: newSettings.showAdditionalModels,
        email_notifications: newSettings.emailNotifications,
        push_notifications: newSettings.pushNotifications,
        weekly_reports: newSettings.weeklyReports,
        monthly_summaries: newSettings.monthlySummaries,
        two_factor_auth: newSettings.twoFactorAuth,
        session_timeout: newSettings.sessionTimeout,
        data_retention_days: newSettings.dataRetentionDays,
        export_format: newSettings.exportFormat,
        chat_dark_mode: newSettings.chatDarkMode,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const updateSetting = async <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    try {
      // Update local state immediately for optimistic UI
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Apply theme changes immediately
      if (key === 'theme') {
        applyTheme(value as string);
      }

      // Apply accent color changes immediately
      if (key === 'accentColor') {
        applyAccentColor(value as string);
      }

      // Provide specific feedback for language and voice settings
      if (key === 'language') {
        const languageNames: Record<string, string> = {
          'auto': 'Auto-detect',
          'en': 'English',
          'es': 'Spanish',
          'fr': 'French',
        };
        toast({
          title: "Language Updated",
          description: `AI will respond primarily in ${languageNames[value as string] || value}`,
        });
      } else if (key === 'spokenLanguage') {
        const languageNames: Record<string, string> = {
          'auto': 'Auto-detect',
          'en': 'English',
          'es': 'Spanish',
          'fr': 'French',
        };
        toast({
          title: "Spoken Language Updated",
          description: `Voice recognition optimized for ${languageNames[value as string] || value}`,
        });
      } else if (key === 'voice') {
        toast({
          title: "Voice Changed",
          description: `Voice set to ${value}`,
        });
        // Auto-play voice preview after a short delay
        setTimeout(() => playVoice(value as string), 500);
      } else {
        toast({
          title: "Settings updated",
          description: "Your preferences have been saved.",
        });
      }

      // Persist settings to database
      await persistSettings(newSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // System theme
      root.classList.remove('dark', 'light');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    }
  };

  const applyAccentColor = (color: string) => {
    const root = document.documentElement;
    
    // Define accent color palettes
    const colors = {
      default: { primary: '222.2 47.4% 11.2%', primaryForeground: '210 40% 98%' },
      blue: { primary: '221.2 83.2% 53.3%', primaryForeground: '210 40% 98%' },
      green: { primary: '142.1 76.2% 36.3%', primaryForeground: '355.7 100% 97.3%' },
      purple: { primary: '262.1 83.3% 57.8%', primaryForeground: '210 40% 98%' },
    };

    const selectedColor = colors[color as keyof typeof colors] || colors.default;
    root.style.setProperty('--primary', selectedColor.primary);
    root.style.setProperty('--primary-foreground', selectedColor.primaryForeground);
  };

  const exportData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { format: settings.exportFormat }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: settings.exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finlo-export-${new Date().toISOString()}.${settings.exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-user-account');

      if (error) throw error;

      await supabase.auth.signOut();
      navigate('/');

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const playVoice = async (voice: string) => {
    try {
      console.log('🔊 Playing voice preview:', voice);
      
      const { data, error } = await supabase.functions.invoke('ai-cfo-text-to-speech', {
        body: { 
          text: "Hello, I'm your AI CFO assistant. This is how I sound with this voice setting.",
          voice: voice
        }
      });

      if (error) {
        console.error('Error generating voice preview:', error);
        toast({
          title: "Voice preview unavailable",
          description: "Using browser fallback",
          variant: "destructive",
        });
        
        // Fallback to browser TTS
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            "Hello, I'm your AI CFO assistant."
          );
          speechSynthesis.speak(utterance);
        }
        return;
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing voice:', error);
      toast({
        title: "Error",
        description: "Could not play voice preview",
        variant: "destructive",
      });
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      isLoading,
      playVoice,
      exportData,
      deleteAccount,
      signOut,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};