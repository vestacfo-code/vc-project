import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Target, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetVarianceCardProps {
  hotelId: string
}

interface BudgetTarget {
  target_revpar: number | null
  target_occupancy: number | null
  target_revenue: number | null
}

interface DailyMetricRow {
  revpar: number | null
  occupancy_rate: number | null
  total_revenue: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function sumValues(values: (number | null)[]): number | null {
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
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(2)}`
}

function fmtPct(val: number | null): string {
  if (val === null) return '—'
  return `${(val * 100).toFixed(1)}%`
}

// ─── Single KPI row ───────────────────────────────────────────────────────────

interface KpiRowProps {
  label: string
  actual: string
  target: string
  variance: number | null
}

function KpiRow({ label, actual, target, variance }: KpiRowProps) {
  const hasVariance = variance !== null

  let badgeClass = 'bg-vesta-mist/40 text-vesta-navy/80 border-vesta-navy/10'
  let VarianceIcon = Minus
  let varianceText = '—'

  if (hasVariance) {
    const sign = variance >= 0 ? '+' : ''
    varianceText = `${sign}${variance.toFixed(1)}%`
    if (variance >= 0) {
      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200'
      VarianceIcon = TrendingUp
    } else {
      badgeClass = 'bg-red-50 text-red-800 border-red-200'
      VarianceIcon = TrendingDown
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-vesta-navy/10 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-vesta-navy/65">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-vesta-navy">{actual}</span>
          {target !== '—' && (
            <span className="text-xs text-vesta-navy/65">/ {target}</span>
          )}
        </div>
      </div>
      <Badge className={`text-xs border flex items-center gap-1 shrink-0 ml-3 ${badgeClass}`}>
        <VarianceIcon className="h-3 w-3" />
        {varianceText}
      </Badge>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function BudgetVarianceCard({ hotelId }: BudgetVarianceCardProps) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  // Fetch this month's budget target
  const { data: budgetTarget, isLoading: targetLoading } = useQuery({
    queryKey: ['budget_target', hotelId, year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_targets')
        .select('target_revpar, target_occupancy, target_revenue')
        .eq('hotel_id', hotelId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle()
      if (error) throw error
      return data as BudgetTarget | null
    },
    enabled: !!hotelId,
  })

  // Fetch daily metrics for this month
  const { data: dailyRows, isLoading: metricsLoading } = useQuery({
    queryKey: ['daily_metrics_month', hotelId, monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('revpar, occupancy_rate, total_revenue')
        .eq('hotel_id', hotelId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
      if (error) throw error
      return data as DailyMetricRow[]
    },
    enabled: !!hotelId,
  })

  const isLoading = targetLoading || metricsLoading
  const hasBudget = budgetTarget !== null && budgetTarget !== undefined

  const actRevpar = avg(dailyRows?.map((r) => r.revpar) ?? [])
  const actOccupancy = avg(dailyRows?.map((r) => r.occupancy_rate) ?? [])
  const actRevenue = sumValues(dailyRows?.map((r) => r.total_revenue) ?? [])

  const kpis: KpiRowProps[] = [
    {
      label: 'RevPAR',
      actual: fmtUsd(actRevpar),
      target: fmtUsd(budgetTarget?.target_revpar ?? null),
      variance: variancePct(actRevpar, budgetTarget?.target_revpar ?? null),
    },
    {
      label: 'Occupancy',
      actual: fmtPct(actOccupancy),
      target: fmtPct(budgetTarget?.target_occupancy ?? null),
      variance: variancePct(actOccupancy, budgetTarget?.target_occupancy ?? null),
    },
    {
      label: 'Revenue',
      actual: fmtUsd(actRevenue),
      target: fmtUsd(budgetTarget?.target_revenue ?? null),
      variance: variancePct(actRevenue, budgetTarget?.target_revenue ?? null),
    },
  ]

  return (
    <Card className="h-full border border-vesta-navy/10 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
            <Target className="h-4 w-4 text-vesta-gold" />
            Budget vs Actual
          </CardTitle>
          <Link
            to="/budget"
            className="flex items-center gap-1 text-xs text-vesta-navy-muted transition-colors hover:text-vesta-gold"
          >
            Manage
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-vesta-navy/65">{format(now, 'MMMM yyyy')} — month to date</p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16 bg-vesta-mist/50" />
                  <Skeleton className="h-4 w-20 bg-vesta-mist/50" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full bg-vesta-mist/50" />
              </div>
            ))}
          </div>
        ) : !hasBudget ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Target className="h-7 w-7 text-vesta-navy/80 mb-2" />
            <p className="text-sm font-medium text-vesta-navy/80">No budget targets set</p>
            <p className="text-xs text-vesta-navy/65 mt-1 mb-3">
              Set monthly targets to track performance
            </p>
            <Link
              to="/budget"
              className="flex items-center gap-1 text-xs font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
            >
              Set budget targets
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div>
            {kpis.map((kpi) => (
              <KpiRow key={kpi.label} {...kpi} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
