import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, AlertTriangle, Clock, Filter, ShieldAlert, ScanLine } from 'lucide-react'
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
    badgeClass: 'border border-red-200 bg-red-50 text-red-800',
    textColor: 'text-red-700',
  },
  high: {
    label: 'High',
    borderColor: 'border-l-orange-500',
    badgeClass: 'border border-orange-200 bg-orange-50 text-orange-900',
    textColor: 'text-orange-800',
  },
  medium: {
    label: 'Medium',
    borderColor: 'border-l-amber-500',
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-900',
    textColor: 'text-amber-800',
  },
  low: {
    label: 'Low',
    borderColor: 'border-l-blue-500',
    badgeClass: 'border border-blue-200 bg-blue-50 text-blue-900',
    textColor: 'text-blue-800',
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
    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-200" />
  )
}

export default function Anomalies() {
  const { hotelId } = useHotelDashboard()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async () => {
    if (!hotelId || isScanning) return
    setIsScanning(true)
    try {
      const { data, error } = await supabase.functions.invoke('detect-hotel-anomalies', {
        body: { hotel_id: hotelId },
      })
      if (error) throw error
      const count: number = data?.anomalies_detected ?? 0
      toast.success(`Found ${count} anomal${count === 1 ? 'y' : 'ies'}`)
      queryClient.invalidateQueries({ queryKey: ['anomalies', hotelId] })
    } catch (err) {
      toast.error('Failed to scan for anomalies')
    } finally {
      setIsScanning(false)
    }
  }

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
    <div className="min-h-full space-y-8 p-6 text-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ShieldAlert className="h-6 w-6 text-vesta-gold" />
            Anomaly Detection
          </h1>
          <p className="mt-1 text-slate-600">
            Monitor and resolve unusual patterns detected in your hotel's performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isLoading && openCount > 0 && (
            <>
              <Badge className="border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {openCount} open
              </Badge>
              {criticalCount > 0 && (
                <Badge className="border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-800">
                  {criticalCount} critical
                </Badge>
              )}
            </>
          )}
          <Button
            onClick={handleScan}
            disabled={isScanning || !hotelId}
            className="bg-vesta-gold font-medium text-slate-950 hover:bg-vesta-gold/90"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning…' : 'Scan for Anomalies'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'border border-vesta-gold/35 bg-vesta-gold/15 text-vesta-navy'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {SEVERITY_FILTERS.map((f) => {
            const cfg = f.value !== 'all' ? SEVERITY_CONFIG[f.value as Severity] : null
            return (
              <button
                key={f.value}
                onClick={() => setSeverityFilter(f.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  severityFilter === f.value
                    ? cfg
                      ? `${cfg.badgeClass}`
                      : 'border border-vesta-gold/35 bg-vesta-gold/15 text-vesta-navy'
                    : 'text-slate-600 hover:bg-slate-100'
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
        <Card className="border border-vesta-navy/10 bg-white shadow-sm">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            <p className="text-lg font-medium text-slate-900">No anomalies detected</p>
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
                className={`border border-slate-200 bg-white shadow-sm border-l-4 ${cfg.borderColor} transition-opacity ${
                  isResolved ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-base font-semibold leading-tight text-slate-900">
                          {anomaly.title}
                        </span>
                        <Badge className={`text-xs border shrink-0 ${cfg.badgeClass}`}>
                          {cfg.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-slate-200 text-xs text-slate-600"
                        >
                          {anomaly.metric}
                        </Badge>
                      </div>

                      <p className="mb-3 text-sm leading-snug text-slate-600">
                        {anomaly.description}
                      </p>

                      {hasValueRange && (
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${cfg.textColor}`} />
                          <span className="text-sm text-slate-700">
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
                            <span className="text-amber-800">
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
                            <span className="text-emerald-800">
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
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          {isAcknowledged ? (
                            <Badge className="border border-amber-200 bg-amber-50 text-amber-900">
                              <Clock className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-900 hover:border-amber-400 hover:bg-amber-50"
                              disabled={acknowledgeMutation.isPending}
                              onClick={() => acknowledgeMutation.mutate(anomaly.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-300 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50"
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
