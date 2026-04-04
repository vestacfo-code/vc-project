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

/** DB uses info | warning | critical; UI uses low–critical. */
function mapDbSeverity(raw: string | null | undefined): Severity {
  const s = (raw ?? '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'warning') return 'medium';
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  return 'low';
}

interface Anomaly {
  id: string;
  hotel_id: string;
  date: string;
  metric: string;
  title: string;
  description: string;
  severity: string;
  resolved: boolean | null;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string; icon: React.ReactNode }> = {
  low: {
    label: 'Low',
    className: 'border border-blue-200 bg-blue-50 text-blue-800',
    icon: <Info className="h-3 w-3" />,
  },
  medium: {
    label: 'Medium',
    className: 'border border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  high: {
    label: 'High',
    className: 'border border-orange-200 bg-orange-50 text-orange-900',
    icon: <AlertOctagon className="h-3 w-3" />,
  },
  critical: {
    label: 'Critical',
    className: 'border border-red-200 bg-red-50 text-red-800',
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
        (a, b) =>
          (SEVERITY_ORDER[mapDbSeverity(a.severity)] ?? 9) -
          (SEVERITY_ORDER[mapDbSeverity(b.severity)] ?? 9)
      );
    },
    enabled: !!hotelId,
  });

  const resolveMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('anomalies')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
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
    <Card className="h-full border border-vesta-navy/10 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Recent Anomalies
        </CardTitle>
        <p className="text-xs text-slate-500">Last 7 days — unresolved</p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-2">
                <Skeleton className="h-4 w-20 bg-slate-200" />
                <Skeleton className="h-4 w-full bg-slate-200" />
                <Skeleton className="h-3 w-24 bg-slate-200" />
              </div>
            ))}
          </div>
        ) : !anomalies || anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="h-8 w-8 text-emerald-500 mb-3" />
            <p className="text-sm font-medium text-slate-700">All clear!</p>
            <p className="text-xs text-slate-500 mt-1">
              No anomalies detected — your metrics look healthy
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {anomalies.map((anomaly) => {
              const uiSeverity = mapDbSeverity(anomaly.severity);
              const severityCfg = SEVERITY_CONFIG[uiSeverity] ?? SEVERITY_CONFIG.low;
              return (
                <div
                  key={anomaly.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Badge
                      className={`text-xs border flex items-center gap-1 ${severityCfg.className}`}
                    >
                      {severityCfg.icon}
                      {severityCfg.label}
                    </Badge>
                    <span className="text-xs text-slate-500 shrink-0">
                      {format(new Date(anomaly.date + 'T00:00:00'), 'MMM d')}
                    </span>
                  </div>
                  <p className="mb-1 text-xs font-semibold text-slate-900">{anomaly.title}</p>
                  <p className="mb-1 text-[11px] font-medium capitalize text-slate-500">
                    {anomaly.metric.replace(/_/g, ' ')}
                  </p>
                  <p className="mb-2 text-xs leading-relaxed text-slate-600">{anomaly.description}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
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
