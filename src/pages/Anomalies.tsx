import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, AlertTriangle, Clock, Filter, ShieldAlert } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

type Severity = 'critical' | 'high' | 'medium' | 'low'
type StatusFilter = 'all' | 'open' | 'resolved'
type SeverityFilter = 'all' | Severity

interface Anomaly {
  id: string
  hotel_id: string
  date: string
  metric: string
  title: string
  description: string
  severity: string
  current_value: number | null
  expected_min: number | null
  expected_max: number | null
  detected_at: string
  resolved: boolean | null
  resolved_at: string | null
  acknowledged: boolean | null
  acknowledged_at: string | null
  acknowledged_by: string | null
}

const SEVERITY_CONFIG: Record<Severity, {
  label: string
  borderColor: string
  badgeClass: string
  textColor: string
}> = {
  critical: {
    label: 'Critical',
    borderColor: 'border-l-red-500',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    textColor: 'text-red-400',
  },
  high: {
    label: 'High',
    borderColor: 'border-l-orange-500',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    textColor: 'text-orange-400',
  },
  medium: {
    label: 'Medium',
    borderColor: 'border-l-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    textColor: 'text-amber-400',
  },
  low: {
    label: 'Low',
    borderColor: 'border-l-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    textColor: 'text-blue-400',
  },
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
]

const SEVERITY_FILTERS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function formatMetricValue(value: number | null, metric: string): string {
  if (value === null) return 'N/A'
  const monetaryMetrics = ['revpar', 'adr', 'revenue', 'trevpar', 'goppar']
  const isMonetary = monetaryMetrics.some((m) => metric.toLowerCase().includes(m))
  if (isMonetary) return `$${value.toFixed(2)}`
  const percentMetrics = ['occupancy', 'rate', 'percent']
  const isPercent = percentMetrics.some((m) => metric.toLowerCase().includes(m))
  if (isPercent) return `${value.toFixed(1)}%`
  return value.toFixed(2)
}

function SkeletonCard() {
  return (
    <div className="h-36 bg-gray-800/50 rounded-xl border border-gray-700 animate-pulse" />
  )
}

export default function Anomalies() {
  const { hotelId } = useHotelDashboard()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')

  const { data: anomalies = [], isLoading } = useQuery<Anomaly[]>({
    queryKey: ['anomalies', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('detected_at', { ascending: false })
      if (error) throw error
      return data as Anomaly[]
    },
    enabled: !!hotelId,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('anomalies')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', anomalyId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies', hotelId] })
      toast.success('Anomaly acknowledged')
    },
    onError: () => {
      toast.error('Failed to acknowledge anomaly')
    },
  })

  const resolveMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('anomalies')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', anomalyId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies', hotelId] })
      toast.success('Anomaly resolved')
    },
    onError: () => {
      toast.error('Failed to resolve anomaly')
    },
  })

  const filtered = anomalies.filter((a) => {
    if (statusFilter === 'open' && a.resolved) return false
    if (statusFilter === 'resolved' && !a.resolved) return false
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    return true
  })

  const openCount = anomalies.filter((a) => !a.resolved).length
  const criticalCount = anomalies.filter((a) => a.severity === 'critical' && !a.resolved).length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Anomaly Detection
          </h1>
          <p className="text-slate-400 mt-1">
            Monitor and resolve unusual patterns detected in your hotel's performance metrics.
          </p>
        </div>
        {!isLoading && openCount > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <Badge className="bg-gray-800 text-slate-300 border-gray-700 text-sm px-3 py-1">
              {openCount} open
            </Badge>
            {criticalCount > 0 && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-sm px-3 py-1">
                {criticalCount} critical
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
          {SEVERITY_FILTERS.map((f) => {
            const cfg = f.value !== 'all' ? SEVERITY_CONFIG[f.value as Severity] : null
            return (
              <button
                key={f.value}
                onClick={() => setSeverityFilter(f.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  severityFilter === f.value
                    ? cfg
                      ? `${cfg.badgeClass} border`
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-gray-800'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium text-lg">No anomalies detected</p>
            <p className="text-slate-500 text-sm mt-1">
              {statusFilter !== 'all' || severityFilter !== 'all'
                ? 'No anomalies match the current filters.'
                : 'All metrics are within expected ranges.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((anomaly) => {
            const severityKey = (anomaly.severity ?? 'low') as Severity
            const cfg = SEVERITY_CONFIG[severityKey] ?? SEVERITY_CONFIG.low
            const isResolved = !!anomaly.resolved
            const isAcknowledged = !!anomaly.acknowledged && !isResolved

            const hasValueRange =
              anomaly.current_value !== null ||
              anomaly.expected_min !== null ||
              anomaly.expected_max !== null

            return (
              <Card
                key={anomaly.id}
                className={`bg-gray-800/50 border-gray-700 border-l-4 ${cfg.borderColor} transition-opacity ${
                  isResolved ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-semibold text-white text-base leading-tight">
                          {anomaly.title}
                        </span>
                        <Badge className={`text-xs border shrink-0 ${cfg.badgeClass}`}>
                          {cfg.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-600 text-slate-400 shrink-0"
                        >
                          {anomaly.metric}
                        </Badge>
                      </div>

                      <p className="text-slate-400 text-sm leading-snug mb-3">
                        {anomaly.description}
                      </p>

                      {hasValueRange && (
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${cfg.textColor}`} />
                          <span className="text-sm text-slate-300">
                            <span className="font-medium">{anomaly.metric}:</span>{' '}
                            {anomaly.current_value !== null ? (
                              <>
                                <span className={cfg.textColor}>
                                  {formatMetricValue(anomaly.current_value, anomaly.metric)}
                                </span>
                                {(anomaly.expected_min !== null || anomaly.expected_max !== null) && (
                                  <span className="text-slate-500">
                                    {' '}(expected{' '}
                                    {anomaly.expected_min !== null
                                      ? formatMetricValue(anomaly.expected_min, anomaly.metric)
                                      : '?'}
                                    {' '}–{' '}
                                    {anomaly.expected_max !== null
                                      ? formatMetricValue(anomaly.expected_max, anomaly.metric)
                                      : '?'}
                                    )
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-500">
                                Expected{' '}
                                {anomaly.expected_min !== null
                                  ? formatMetricValue(anomaly.expected_min, anomaly.metric)
                                  : '?'}
                                {' '}–{' '}
                                {anomaly.expected_max !== null
                                  ? formatMetricValue(anomaly.expected_max, anomaly.metric)
                                  : '?'}
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(anomaly.detected_at), { addSuffix: true })}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span>{format(new Date(anomaly.date), 'MMM d, yyyy')}</span>
                        {isAcknowledged && anomaly.acknowledged_at && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-amber-400/70">
                              Acknowledged{' '}
                              {formatDistanceToNow(new Date(anomaly.acknowledged_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </>
                        )}
                        {isResolved && anomaly.resolved_at && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-400/70">
                              Resolved{' '}
                              {formatDistanceToNow(new Date(anomaly.resolved_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: actions / status badges */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isResolved ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          {isAcknowledged ? (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border">
                              <Clock className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/60"
                              disabled={acknowledgeMutation.isPending}
                              onClick={() => acknowledgeMutation.mutate(anomaly.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/60"
                            disabled={resolveMutation.isPending}
                            onClick={() => resolveMutation.mutate(anomaly.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
