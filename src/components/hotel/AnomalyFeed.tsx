import React from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AnomalyFeedProps {
  hotelId: string;
}

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface Anomaly {
  id: string;
  hotel_id: string;
  date: string;
  metric_name: string;
  expected_value: number | null;
  actual_value: number | null;
  deviation_pct: number | null;
  severity: Severity;
  message: string;
  resolved: boolean;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string; icon: React.ReactNode }> = {
  low: {
    label: 'Low',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Info className="h-3 w-3" />,
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: <AlertOctagon className="h-3 w-3" />,
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertOctagon className="h-3 w-3" />,
  },
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const AnomalyFeed: React.FC<AnomalyFeedProps> = ({ hotelId }) => {
  const queryClient = useQueryClient();
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['anomalies', hotelId, sevenDaysAgo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('resolved', false)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false });

      if (error) throw error;

      const rows = data as Anomaly[];
      return rows.sort(
        (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
      );
    },
    enabled: !!hotelId,
  });

  const resolveMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('anomalies')
        .update({ resolved: true })
        .eq('id', anomalyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies', hotelId] });
      toast.success('Anomaly marked as resolved');
    },
    onError: () => {
      toast.error('Failed to resolve anomaly');
    },
  });

  return (
    <Card className="bg-gray-800/50 border border-gray-700 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          Recent Anomalies
        </CardTitle>
        <p className="text-xs text-gray-500">Last 7 days — unresolved</p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-2">
                <Skeleton className="h-4 w-20 bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-3 w-24 bg-gray-700" />
              </div>
            ))}
          </div>
        ) : !anomalies || anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="h-8 w-8 text-emerald-500 mb-3" />
            <p className="text-sm text-gray-300 font-medium">All clear!</p>
            <p className="text-xs text-gray-500 mt-1">
              No anomalies detected — your metrics look healthy
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {anomalies.map((anomaly) => {
              const severityCfg = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.low;
              return (
                <div
                  key={anomaly.id}
                  className="rounded-lg border border-gray-700 bg-gray-900/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Badge
                      className={`text-xs border flex items-center gap-1 ${severityCfg.className}`}
                    >
                      {severityCfg.icon}
                      {severityCfg.label}
                    </Badge>
                    <span className="text-xs text-gray-500 shrink-0">
                      {format(new Date(anomaly.date + 'T00:00:00'), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-200 mb-1 capitalize">
                    {anomaly.metric_name.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{anomaly.message}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => resolveMutation.mutate(anomaly.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark resolved
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnomalyFeed;
