import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetTarget {
  id: string
  hotel_id: string
  year: number
  month: number
  target_revpar: number | null
  target_adr: number | null
  target_occupancy: number | null
  target_revenue: number | null
  target_gop: number | null
  target_labor_ratio: number | null
  created_at: string
  updated_at: string
}

interface DailyMetricRow {
  revpar: number | null
  adr: number | null
  occupancy_rate: number | null
  total_revenue: number | null
  gop: number | null
  labor_cost_ratio: number | null
}

interface Actuals {
  revpar: number | null
  adr: number | null
  occupancy: number | null
  revenue: number | null
  gop: number | null
  laborRatio: number | null
}

interface FormValues {
  target_revpar: string
  target_adr: string
  target_occupancy: string   // displayed as %
  target_revenue: string
  target_gop: string
  target_labor_ratio: string // displayed as %
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function sum(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0)
}

function variancePct(actual: number | null, target: number | null): number | null {
  if (actual === null || target === null || target === 0) return null
  return ((actual - target) / Math.abs(target)) * 100
}

function fmtUsd(val: number | null): string {
  if (val === null) return '—'
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(val: number | null, decimals = 1): string {
  if (val === null) return '—'
  return `${(val * 100).toFixed(decimals)}%`
}

function fmtVariance(pct: number | null): string {
  if (pct === null) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function targetToForm(t: BudgetTarget | null | undefined): FormValues {
  return {
    target_revpar: t?.target_revpar != null ? String(t.target_revpar) : '',
    target_adr: t?.target_adr != null ? String(t.target_adr) : '',
    target_occupancy: t?.target_occupancy != null ? String((t.target_occupancy * 100).toFixed(2)) : '',
    target_revenue: t?.target_revenue != null ? String(t.target_revenue) : '',
    target_gop: t?.target_gop != null ? String(t.target_gop) : '',
    target_labor_ratio: t?.target_labor_ratio != null ? String((t.target_labor_ratio * 100).toFixed(2)) : '',
  }
}

// ─── Variance row ─────────────────────────────────────────────────────────────

interface VarianceRowProps {
  label: string
  actual: string
  target: string
  variancePct: number | null
}

function VarianceRow({ label, actual, target, variancePct: vPct }: VarianceRowProps) {
  const hasData = vPct !== null

  let badgeClass = 'border border-vesta-navy/10 bg-vesta-mist/40 text-vesta-navy/80'
  let Icon = Minus

  if (hasData) {
    if (vPct >= 0) {
      badgeClass = 'border border-emerald-200 bg-emerald-50 text-emerald-800'
      Icon = TrendingUp
    } else {
      badgeClass = 'border border-red-200 bg-red-50 text-red-800'
      Icon = TrendingDown
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-vesta-navy/10 py-3 last:border-0">
      <span className="w-36 shrink-0 text-sm text-vesta-navy/80">{label}</span>
      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="text-right">
          <p className="mb-0.5 text-xs text-vesta-navy/65">Actual</p>
          <p className="text-sm font-medium text-vesta-navy">{actual}</p>
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-xs text-vesta-navy/65">Target</p>
          <p className="text-sm font-medium text-vesta-navy/90">{target}</p>
        </div>
        <Badge className={`text-xs border flex items-center gap-1 min-w-[68px] justify-center ${badgeClass}`}>
          <Icon className="h-3 w-3" />
          {hasData ? fmtVariance(vPct) : 'No target'}
        </Badge>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Budget() {
  const { hotelId, hotel, loading: hotelLoading } = useHotelDashboard()
  const queryClient = useQueryClient()

  const now = new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  )

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1  // 1-based

  function prevMonth() {
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  // ── Fetch budget target ────────────────────────────────────────────────────
  const { data: budgetTarget, isLoading: targetLoading } = useQuery({
    queryKey: ['budget_target', hotelId, year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_targets')
        .select('*')
        .eq('hotel_id', hotelId!)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle()
      if (error) throw error
      return data as BudgetTarget | null
    },
    enabled: !!hotelId,
  })

  // ── Fetch daily_metrics for selected month ─────────────────────────────────
  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd')

  const { data: dailyRows, isLoading: metricsLoading } = useQuery({
    queryKey: ['daily_metrics_month', hotelId, monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('revpar, adr, occupancy_rate, total_revenue, gop, labor_cost_ratio')
        .eq('hotel_id', hotelId!)
        .gte('date', monthStart)
        .lte('date', monthEnd)
      if (error) throw error
      return data as DailyMetricRow[]
    },
    enabled: !!hotelId,
  })

  // ── Compute actuals ────────────────────────────────────────────────────────
  const actuals: Actuals = {
    revpar: avg(dailyRows?.map((r) => r.revpar) ?? []),
    adr: avg(dailyRows?.map((r) => r.adr) ?? []),
    occupancy: avg(dailyRows?.map((r) => r.occupancy_rate) ?? []),
    revenue: sum(dailyRows?.map((r) => r.total_revenue) ?? []),
    gop: sum(dailyRows?.map((r) => r.gop) ?? []),
    laborRatio: avg(dailyRows?.map((r) => r.labor_cost_ratio) ?? []),
  }

  const hasMetricsData = dailyRows !== undefined && dailyRows.length > 0

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormValues>(() => targetToForm(null))

  // Sync form when target loads (but not on every re-render)
  const [lastLoadedTargetId, setLastLoadedTargetId] = useState<string | null | undefined>(undefined)
  if (targetLoading === false && budgetTarget !== undefined) {
    const incomingId = budgetTarget?.id ?? null
    if (incomingId !== lastLoadedTargetId) {
      setLastLoadedTargetId(incomingId)
      setForm(targetToForm(budgetTarget))
    }
  }

  function handleChange(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Save mutation ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!hotelId) throw new Error('No hotel linked')

      const payload = {
        hotel_id: hotelId,
        year,
        month,
        target_revpar: form.target_revpar !== '' ? parseFloat(form.target_revpar) : null,
        target_adr: form.target_adr !== '' ? parseFloat(form.target_adr) : null,
        target_occupancy: form.target_occupancy !== '' ? parseFloat(form.target_occupancy) / 100 : null,
        target_revenue: form.target_revenue !== '' ? parseFloat(form.target_revenue) : null,
        target_gop: form.target_gop !== '' ? parseFloat(form.target_gop) : null,
        target_labor_ratio: form.target_labor_ratio !== '' ? parseFloat(form.target_labor_ratio) / 100 : null,
        updated_at: new Date().toISOString(),
      }

      if (budgetTarget?.id) {
        const { error } = await supabase
          .from('budget_targets')
          .update(payload)
          .eq('id', budgetTarget.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('budget_targets')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Budget targets saved')
      queryClient.invalidateQueries({ queryKey: ['budget_target', hotelId, year, month] })
    },
    onError: (err: Error) => {
      toast.error(`Failed to save: ${err.message}`)
    },
  })

  const isLoading = hotelLoading || targetLoading

  // ── Variance data ──────────────────────────────────────────────────────────
  const tRevpar = budgetTarget?.target_revpar ?? null
  const tAdr = budgetTarget?.target_adr ?? null
  const tOcc = budgetTarget?.target_occupancy ?? null
  const tRevenue = budgetTarget?.target_revenue ?? null
  const tGop = budgetTarget?.target_gop ?? null
  const tLabor = budgetTarget?.target_labor_ratio ?? null

  const varianceRows = [
    {
      label: 'RevPAR',
      actual: fmtUsd(actuals.revpar),
      target: fmtUsd(tRevpar),
      variance: variancePct(actuals.revpar, tRevpar),
    },
    {
      label: 'ADR',
      actual: fmtUsd(actuals.adr),
      target: fmtUsd(tAdr),
      variance: variancePct(actuals.adr, tAdr),
    },
    {
      label: 'Occupancy',
      actual: fmtPct(actuals.occupancy),
      target: fmtPct(tOcc),
      variance: variancePct(actuals.occupancy, tOcc),
    },
    {
      label: 'Total Revenue',
      actual: fmtUsd(actuals.revenue),
      target: fmtUsd(tRevenue),
      variance: variancePct(actuals.revenue, tRevenue),
    },
    {
      label: 'GOP',
      actual: fmtUsd(actuals.gop),
      target: fmtUsd(tGop),
      variance: variancePct(actuals.gop, tGop),
    },
    {
      label: 'Labor Cost Ratio',
      actual: fmtPct(actuals.laborRatio),
      target: fmtPct(tLabor),
      // For labor ratio, lower is better — invert the sign
      variance: variancePct(actuals.laborRatio, tLabor) !== null
        ? -(variancePct(actuals.laborRatio, tLabor) as number)
        : null,
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full space-y-8 p-6 text-vesta-navy">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-vesta-navy">Budget Targets</h1>
          <p className="mt-1 text-vesta-navy/80">
            Set monthly KPI targets and track actuals vs budget
            {hotel?.name ? ` for ${hotel.name}` : ''}.
          </p>
        </div>

        {/* Month / Year navigator */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-vesta-navy/10 bg-white text-vesta-navy/90 hover:bg-vesta-mist/25"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[130px] text-center">
            <p className="text-sm font-semibold text-vesta-navy">
              {format(selectedDate, 'MMMM yyyy')}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-vesta-navy/10 bg-white text-vesta-navy/90 hover:bg-vesta-mist/25"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!hotelId && !hotelLoading && (
        <Card className="border border-vesta-navy/10 bg-white shadow-sm">
          <CardContent className="py-10 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-vesta-navy-muted" />
            <p className="text-vesta-navy/80">No hotel linked to your account.</p>
            <p className="text-vesta-navy/65 text-sm mt-1">Ask your administrator to add you to a hotel.</p>
          </CardContent>
        </Card>
      )}

      {hotelId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Target Form ───────────────────────────────────────────────── */}
          <Card className="border border-vesta-navy/10 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
                <Target className="h-4 w-4 text-vesta-gold" />
                Set Targets — {format(selectedDate, 'MMMM yyyy')}
              </CardTitle>
              <p className="text-xs text-vesta-navy/65">
                {budgetTarget ? 'Update existing targets for this month.' : 'No targets set yet for this month.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 rounded-md bg-vesta-mist/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-vesta-navy/80">RevPAR Target ($)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 120.00"
                        value={form.target_revpar}
                        onChange={(e) => handleChange('target_revpar', e.target.value)}
                        className="border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-vesta-navy/80">ADR Target ($)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 185.00"
                        value={form.target_adr}
                        onChange={(e) => handleChange('target_adr', e.target.value)}
                        className="border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-vesta-navy/80">Occupancy Target (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g. 72.5"
                        value={form.target_occupancy}
                        onChange={(e) => handleChange('target_occupancy', e.target.value)}
                        className="border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-vesta-navy/80">Revenue Target ($)</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 250000"
                        value={form.target_revenue}
                        onChange={(e) => handleChange('target_revenue', e.target.value)}
                        className="border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-vesta-navy/80">GOP Target ($)</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 90000"
                        value={form.target_gop}
                        onChange={(e) => handleChange('target_gop', e.target.value)}
                        className="border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-vesta-navy/80">Labor Cost Ratio Target (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g. 28.0"
                        value={form.target_labor_ratio}
                        onChange={(e) => handleChange('target_labor_ratio', e.target.value)}
                        className="border-vesta-navy/10 bg-white text-vesta-navy placeholder:text-vesta-navy-muted focus:border-vesta-gold/50 focus:ring-vesta-gold/20"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-vesta-gold font-semibold text-vesta-navy hover:bg-vesta-gold/90"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !hotelId}
                  >
                    {saveMutation.isPending
                      ? 'Saving…'
                      : budgetTarget
                        ? 'Update Targets'
                        : 'Save Targets'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Actuals vs Budget ─────────────────────────────────────────── */}
          <Card className="border border-vesta-navy/10 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
                <TrendingUp className="h-4 w-4 text-vesta-gold" />
                Month Actuals vs Budget
              </CardTitle>
              <p className="text-xs text-vesta-navy/65">
                {format(selectedDate, 'MMMM yyyy')} —&nbsp;
                {metricsLoading
                  ? 'loading…'
                  : hasMetricsData
                    ? `${dailyRows!.length} day${dailyRows!.length !== 1 ? 's' : ''} of data`
                    : 'no data synced yet'}
              </p>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 rounded-md bg-vesta-mist/50 animate-pulse" />
                  ))}
                </div>
              ) : !hasMetricsData ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Target className="mb-3 h-8 w-8 text-vesta-navy-muted" />
                  <p className="text-sm font-medium text-vesta-navy/80">No data synced for this month yet</p>
                  <p className="mt-1 text-xs text-vesta-navy/65">
                    Connect a PMS or sync data to see actuals here.
                  </p>
                </div>
              ) : (
                <div>
                  {varianceRows.map((row) => (
                    <VarianceRow
                      key={row.label}
                      label={row.label}
                      actual={row.actual}
                      target={row.target}
                      variancePct={row.variance}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}
