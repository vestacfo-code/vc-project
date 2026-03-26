import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, X, Bell, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
}

const StrategicAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data || []).map(alert => ({
        ...alert,
        severity: alert.severity as 'info' | 'warning' | 'critical'
      })));
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewAlerts = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      // Generate new strategic alerts
      const { generateStrategicAlerts } = await import('@/lib/strategicAlertsHelper');
      const result = await generateStrategicAlerts(user.id, false);
      
      if (result.success) {
        await loadAlerts();
        toast({
          title: "Strategic Alerts Generated",
          description: `Generated ${result.alertsGenerated} new alerts based on your financial data.`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate alerts');
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
      toast({
        title: "Error",
        description: "Failed to generate new alerts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const refreshAlerts = async () => {
    if (!user) return;

    try {
      await loadAlerts();
      toast({
        title: "Alerts Refreshed",
        description: "Alert list has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      toast({
        title: "Error",
        description: "Failed to refresh alerts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Alerts</CardTitle>
          <CardDescription>Loading alerts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <span>Strategic Alerts</span>
            </CardTitle>
            <CardDescription>
              AI-powered alerts for important business events and opportunities
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={generateNewAlerts} 
              disabled={generating}
              variant="default"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Generate Alerts
                </>
              )}
            </Button>
            <Button 
              onClick={refreshAlerts} 
              disabled={generating}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Badge variant="secondary">
              {alerts.filter(a => !a.is_read).length} unread
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-muted-foreground">No alerts at the moment. Your business metrics look good!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border transition-all ${
                alert.is_read ? 'bg-muted/30' : 'bg-card shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                      {!alert.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default StrategicAlerts;