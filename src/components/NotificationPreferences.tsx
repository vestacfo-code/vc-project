import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, Mail, Clock, Moon } from 'lucide-react';

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Email settings
  const [weeklyReportsEnabled, setWeeklyReportsEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [timeOfDay, setTimeOfDay] = useState('09:00:00');

  // Notification preferences
  const [creditAlerts, setCreditAlerts] = useState({ enabled: true, method: 'both' });
  const [strategicAlerts, setStrategicAlerts] = useState({ enabled: true, method: 'both' });
  const [weeklyReports, setWeeklyReports] = useState({ enabled: true, method: 'email' });
  const [financialInsights, setFinancialInsights] = useState({ enabled: true, method: 'in_app' });

  // Quiet hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load email settings
      const { data: emailSettings, error: emailError } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (emailError && emailError.code !== 'PGRST116') {
        throw emailError;
      }

      if (emailSettings) {
        setWeeklyReportsEnabled(emailSettings.weekly_reports_enabled || false);
        setAlertsEnabled(emailSettings.alerts_enabled || true);
        setDayOfWeek(emailSettings.day_of_week || 'monday');
        setTimeOfDay(emailSettings.time_of_day || '09:00:00');

        // Load notification preferences if they exist (stored as JSON)
        const prefs = emailSettings as any;
        if (prefs.notification_preferences) {
          const notifPrefs = prefs.notification_preferences;
          if (notifPrefs.credit_alerts) setCreditAlerts(notifPrefs.credit_alerts);
          if (notifPrefs.strategic_alerts) setStrategicAlerts(notifPrefs.strategic_alerts);
          if (notifPrefs.weekly_reports) setWeeklyReports(notifPrefs.weekly_reports);
          if (notifPrefs.financial_insights) setFinancialInsights(notifPrefs.financial_insights);
        }

        // Load quiet hours (stored as JSON)
        if (prefs.quiet_hours) {
          const qh = prefs.quiet_hours;
          setQuietHoursEnabled(qh.enabled || false);
          setQuietStart(qh.start || '22:00');
          setQuietEnd(qh.end || '08:00');
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const notificationPreferences = {
        credit_alerts: creditAlerts,
        strategic_alerts: strategicAlerts,
        weekly_reports: weeklyReports,
        financial_insights: financialInsights,
      };

      const quietHours = {
        enabled: quietHoursEnabled,
        start: quietStart,
        end: quietEnd,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const { error } = await supabase
        .from('email_settings')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          weekly_reports_enabled: weeklyReportsEnabled,
          alerts_enabled: alertsEnabled,
          day_of_week: dayOfWeek,
          time_of_day: timeOfDay,
          ...(notificationPreferences && { notification_preferences: notificationPreferences } as any),
          ...(quietHours && { quiet_hours: quietHours } as any),
        } as any);

      if (error) throw error;

      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure when and how you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of your financial performance every week
              </p>
            </div>
            <Switch
              checked={weeklyReportsEnabled}
              onCheckedChange={setWeeklyReportsEnabled}
            />
          </div>

          {weeklyReportsEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00:00`}>
                          {`${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Strategic Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important financial insights and warnings
              </p>
            </div>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose how you want to receive different types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Credit Alerts', state: creditAlerts, setState: setCreditAlerts },
            { label: 'Strategic Alerts', state: strategicAlerts, setState: setStrategicAlerts },
            { label: 'Weekly Reports', state: weeklyReports, setState: setWeeklyReports },
            { label: 'Financial Insights', state: financialInsights, setState: setFinancialInsights },
          ].map(({ label, state, setState }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <Label>{label}</Label>
              <div className="flex gap-2">
                <Select
                  value={state.method}
                  onValueChange={(value) => setState({ ...state, method: value })}
                  disabled={!state.enabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <Switch
                  checked={state.enabled}
                  onCheckedChange={(enabled) => setState({ ...state, enabled })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Mute notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Quiet Hours</Label>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={quietStart} onValueChange={setQuietStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {`${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={quietEnd} onValueChange={setQuietEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {`${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};
