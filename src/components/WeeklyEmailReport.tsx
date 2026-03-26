import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Clock, Settings, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailReportSettings {
  weekly_reports_enabled: boolean;
  day_of_week: string;
  time_of_day: string;
  last_sent?: string;
}

const WeeklyEmailReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailReportSettings>({
    weekly_reports_enabled: true, // Default to enabled
    day_of_week: 'monday',        // Default to Monday
    time_of_day: '09:00',         // Default to 9am
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrCreateEmailSettings();
    }
  }, [user]);

  const loadOrCreateEmailSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('weekly_reports_enabled, day_of_week, time_of_day, last_sent')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        setIsInitializing(false);
        return;
      }

      if (data) {
        // User has existing settings
        setSettings({
          weekly_reports_enabled: data.weekly_reports_enabled ?? true,
          day_of_week: data.day_of_week || 'monday',
          time_of_day: data.time_of_day || '09:00',
          last_sent: data.last_sent
        });
      } else {
        // No settings exist - create default settings with weekly reports enabled
        const { data: authUser } = await supabase.auth.getUser();
        const userEmail = authUser?.user?.email || user.email || '';
        
        const { error: createError } = await supabase
          .from('email_settings')
          .insert({
            user_id: user.id,
            email: userEmail,
            weekly_reports_enabled: true,  // Enabled by default
            alerts_enabled: true,
            day_of_week: 'monday',          // Monday default
            time_of_day: '09:00',           // 9am default
          });

        if (createError) {
          console.error('Error creating default settings:', createError);
        } else {
          // Settings are already set to defaults in state
          toast({
            title: "Weekly reports enabled!",
            description: "You'll receive weekly financial insights every Monday at 9:00 AM.",
          });
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleToggleWeeklyReports = async (enabled: boolean) => {
    setIsSavingToggle(true);
    
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser?.user?.email || user?.email || '';

      const { error } = await supabase
        .from('email_settings')
        .upsert({
          user_id: user?.id,
          email: userEmail,
          weekly_reports_enabled: enabled,
          alerts_enabled: true,
          day_of_week: settings.day_of_week,
          time_of_day: settings.time_of_day,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings({ ...settings, weekly_reports_enabled: enabled });

      toast({
        title: enabled ? "Weekly reports enabled!" : "Weekly reports disabled",
        description: enabled 
          ? `You'll receive email reports every ${settings.day_of_week} at ${formatTime(settings.time_of_day)}.`
          : "You won't receive weekly email reports.",
      });
    } catch (error) {
      console.error('Error toggling weekly reports:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToggle(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser?.user?.email || user?.email || '';

      const { error } = await supabase
        .from('email_settings')
        .upsert({
          user_id: user?.id,
          email: userEmail,
          weekly_reports_enabled: settings.weekly_reports_enabled,
          alerts_enabled: true,
          day_of_week: settings.day_of_week,
          time_of_day: settings.time_of_day,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Schedule updated!",
        description: `Reports will be delivered every ${settings.day_of_week} at ${formatTime(settings.time_of_day)}.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings.weekly_reports_enabled) {
      toast({
        title: "Enable weekly reports first",
        description: "Please enable weekly reports to send a test email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-report', {
        body: {
          userId: user?.id,
          sendEmail: true,  // Actually send email
        }
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: "Check your inbox for your weekly financial report.",
      });
    } catch (error) {
      console.error('Test email error:', error);
      toast({
        title: "Failed to send test email",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/5 rounded w-2/3"></div>
          <div className="h-12 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="w-5 h-5 text-white" />
            <h3 className="text-base font-semibold text-white">Weekly Email Reports</h3>
          </div>
          <p className="text-sm text-slate-400">
            Get insightful financial summaries delivered straight to your inbox every week
          </p>
        </div>
        <div className="space-y-6">
          {/* Email Settings */}
          <div className="space-y-4">

            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-white">Weekly Email Reports</Label>
                <p className="text-xs text-slate-500">
                  Receive comprehensive weekly financial summaries via email
                </p>
              </div>
              <Switch
                checked={settings.weekly_reports_enabled}
                onCheckedChange={handleToggleWeeklyReports}
                disabled={isSavingToggle}
              />
            </div>

            {settings.weekly_reports_enabled && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Day of Week</Label>
                    <Select
                      value={settings.day_of_week}
                      onValueChange={(day_of_week) => setSettings({ ...settings, day_of_week })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                        <SelectItem value="monday" className="text-slate-300 focus:bg-white/10 focus:text-white">Monday</SelectItem>
                        <SelectItem value="tuesday" className="text-slate-300 focus:bg-white/10 focus:text-white">Tuesday</SelectItem>
                        <SelectItem value="wednesday" className="text-slate-300 focus:bg-white/10 focus:text-white">Wednesday</SelectItem>
                        <SelectItem value="thursday" className="text-slate-300 focus:bg-white/10 focus:text-white">Thursday</SelectItem>
                        <SelectItem value="friday" className="text-slate-300 focus:bg-white/10 focus:text-white">Friday</SelectItem>
                        <SelectItem value="saturday" className="text-slate-300 focus:bg-white/10 focus:text-white">Saturday</SelectItem>
                        <SelectItem value="sunday" className="text-slate-300 focus:bg-white/10 focus:text-white">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Time of Day</Label>
                    <Select
                      value={settings.time_of_day}
                      onValueChange={(time_of_day) => setSettings({ ...settings, time_of_day })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                        <SelectItem value="06:00" className="text-slate-300 focus:bg-white/10 focus:text-white">6:00 AM</SelectItem>
                        <SelectItem value="07:00" className="text-slate-300 focus:bg-white/10 focus:text-white">7:00 AM</SelectItem>
                        <SelectItem value="08:00" className="text-slate-300 focus:bg-white/10 focus:text-white">8:00 AM</SelectItem>
                        <SelectItem value="09:00" className="text-slate-300 focus:bg-white/10 focus:text-white">9:00 AM</SelectItem>
                        <SelectItem value="10:00" className="text-slate-300 focus:bg-white/10 focus:text-white">10:00 AM</SelectItem>
                        <SelectItem value="12:00" className="text-slate-300 focus:bg-white/10 focus:text-white">12:00 PM</SelectItem>
                        <SelectItem value="17:00" className="text-slate-300 focus:bg-white/10 focus:text-white">5:00 PM</SelectItem>
                        <SelectItem value="18:00" className="text-slate-300 focus:bg-white/10 focus:text-white">6:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {settings.weekly_reports_enabled && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading || !settings.weekly_reports_enabled}
                size="sm"
                className="flex-1 bg-white text-black hover:bg-slate-200"
              >
                <Settings className="w-3 h-3 mr-2" />
                {isLoading ? 'Saving...' : 'Save Schedule'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestEmail}
                disabled={isLoading || !settings.weekly_reports_enabled}
                className="flex-1 bg-transparent text-white border-white/10 hover:bg-white/10"
              >
                <Send className="w-3 h-3 mr-2" />
                Send Test Email
              </Button>
            </div>
          )}

          {/* Status */}
          {settings.weekly_reports_enabled && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Next Report</span>
              </div>
              <p className="text-sm text-slate-400">
                Your next email report will be delivered on {capitalizeFirst(settings.day_of_week)} at {formatTime(settings.time_of_day)}
              </p>
              {settings.last_sent && (
                <p className="text-xs text-slate-500 mt-1">
                  Last sent: {new Date(settings.last_sent).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyEmailReport;
