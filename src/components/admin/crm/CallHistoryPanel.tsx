import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CallLog, CallOutcome } from '@/types/crm';
import { Phone, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const CallHistoryPanel = () => {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    connected: 0,
    connectRate: 0
  });

  useEffect(() => {
    if (user) {
      loadCallHistory();
    }
  }, [user]);

  const loadCallHistory = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('crm_call_logs')
        .select('*')
        .eq('caller_id', user.id)
        .gte('call_date', today.toISOString())
        .order('call_date', { ascending: false })
        .limit(20);

      if (error) throw error;

      const logs = data || [];
      setCallLogs(logs);

      const connected = logs.filter(log => log.outcome === 'connected').length;
      const connectRate = logs.length > 0 ? (connected / logs.length) * 100 : 0;

      setStats({
        totalCalls: logs.length,
        connected,
        connectRate
      });
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const getOutcomeIcon = (outcome?: CallOutcome) => {
    switch (outcome) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'voicemail':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'no_answer':
      case 'busy':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getOutcomeColor = (outcome?: CallOutcome) => {
    switch (outcome) {
      case 'connected':
        return 'default';
      case 'voicemail':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Call History</CardTitle>
        <CardDescription>
          {stats.totalCalls} calls · {stats.connected} connected · {stats.connectRate.toFixed(0)}% connect rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {callLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calls made today</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {callLogs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getOutcomeIcon(log.outcome)}
                        <p className="font-medium text-sm">Contact Call</p>
                        {log.outcome && (
                          <Badge variant={getOutcomeColor(log.outcome) as any} className="text-xs">
                            {log.outcome.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      {log.duration_seconds && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(log.duration_seconds / 60)}m {log.duration_seconds % 60}s
                        </div>
                      )}
                      
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                      )}
                      
                      {log.disposition && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {log.disposition.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.call_date), { addSuffix: true })}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
