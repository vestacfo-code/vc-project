import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Download, UploadCloud, TrendingUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyMetricRow {
  date: string
  revpar: number | null
  adr: number | null
  occupancy_rate: number | null
  goppar: number | null
  room_revenue: number | null
  fnb_revenue: number | null
  spa_revenue: number | null
  other_revenue: number | null
  total_revenue: number | null
  labor_cost: number | null
  labor_cost_ratio: number | null
  total_expenses: number | null
  gop: number | null
  gop_margin: number | null
  rooms_available: number | null
  rooms_sold: number | null
  rooms_out_of_order: number | null
}

interface ExpenseRow {
  date: string
  category: string
  subcategory: string | null
  amount: number | null
  vendor: string | null
  is_recurring: boolean | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumField(rows: DailyMetricRow[], field: keyof DailyMetricRow): number | null {
  const valid = rows
    .map((r) => r[field] as number | null)
    .filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0)
}

function avgField(rows: DailyMetricRow[], field: keyof DailyMetricRow): number | null {
  const valid = rows
    .map((r) => r[field] as number | null)
    .filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function fmtUsd(val: number | null, decimals = 2): string {
  if (val === null) return '—'
  return `$${val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function fmtPct(val: number | null, decimals = 1): string {
  if (val === null) return '—'
  return `${val.toFixed(decimals)}%`
}

function fmtInt(val: number | null): string {
  if (val === null) return '—'
  return val.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatRowProps {
  label: string
  value: string
  highlight?: boolean
}

function StatRow({ label, value, highlight = false }: StatRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-vesta-navy/10 py-2.5 last:border-0">
      <span className={`text-sm ${highlight ? 'font-medium text-vesta-navy' : 'text-vesta-navy/80'}`}>
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${highlight ? 'text-vesta-gold' : 'text-vesta-navy'}`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCsv(rows: DailyMetricRow[], monthDate: Date): void {
  const headers = [
    'date',
    'revpar',
    'adr',
    'occupancy_rate',
    'goppar',
    'room_revenue',
    'fnb_revenue',
    'spa_revenue',
    'other_revenue',
    'total_revenue',
    'labor_cost',
    'labor_cost_ratio',
    'total_expenses',
    'gop',
    'gop_margin',
    'rooms_available',
    'rooms_sold',
    'rooms_out_of_order',
  ] as const

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines: string[] = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vesta-report-${format(monthDate, 'yyyy-MM')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Reports() {
  const { hotelId, hotel, loading: hotelLoading } = useHotelDashboard()

  const now = new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  )

  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd')

  function prevMonth() {
    setSelectedDate((d) => subMonths(d, 1))
  }
  function nextMonth() {
    setSelectedDate((d) => addMonths(d, 1))
  }

  // ── Fetch daily_metrics ────────────────────────────────────────────────────
  const { data: dailyRows, isLoading: metricsLoading } = useQuery({
    queryKey: ['reports_daily_metrics', hotelId, monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select(
          'date, revpar, adr, occupancy_rate, goppar, room_revenue, fnb_revenue, spa_revenue, other_revenue, total_revenue, labor_cost, labor_cost_ratio, total_expenses, gop, gop_margin, rooms_available, rooms_sold, rooms_out_of_order'
        )
        .eq('hotel_id', hotelId!)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: true })
      if (error) throw error
      return data as DailyMetricRow[]
    },
    enabled: !!hotelId,
  })

  // ── Fetch expenses ─────────────────────────────────────────────────────────
  const { data: expenseRows, isLoading: expensesLoading } = useQuery({
    queryKey: ['reports_expenses', hotelId, monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('date, category, subcategory, amount, vendor, is_recurring')
        .eq('hotel_id', hotelId!)
        .gte('date', monthStart)
        .lte('date', monthEnd)
      if (error) throw error
      return data as ExpenseRow[]
    },
    enabled: !!hotelId,
  })

  const isLoading = hotelLoading || metricsLoading || expensesLoading
  const hasData = (dailyRows?.length ?? 0) > 0

  // ── Compute P&L summary ────────────────────────────────────────────────────
  const rows = dailyRows ?? []

  const totalRoomRevenue = sumField(rows, 'room_revenue')
  const totalFnbRevenue = sumField(rows, 'fnb_revenue')
  const totalSpaRevenue = sumField(rows, 'spa_revenue')
  const totalOtherRevenue = sumField(rows, 'other_revenue')

  const totalOtherCombined: number | null =
    totalSpaRevenue !== null || totalOtherRevenue !== null
      ? (totalSpaRevenue ?? 0) + (totalOtherRevenue ?? 0)
      : null

  const totalRevenue = sumField(rows, 'total_revenue')
  const totalExpenses = sumField(rows, 'total_expenses')

  const gop: number | null =
    totalRevenue !== null && totalExpenses !== null
      ? totalRevenue - totalExpenses
      : sumField(rows, 'gop')

  const gopMargin: number | null =
    gop !== null && totalRevenue !== null && totalRevenue !== 0
      ? (gop / totalRevenue) * 100
      : null

  const avgRevpar = avgField(rows, 'revpar')
  const avgAdr = avgField(rows, 'adr')

  const avgOccupancyRaw = avgField(rows, 'occupancy_rate')
  // occupancy_rate is stored as a decimal (0–1) in some setups, or as a % (0–100); normalise
  const avgOccupancy: number | null =
    avgOccupancyRaw !== null
      ? avgOccupancyRaw <= 1
        ? avgOccupancyRaw * 100
        : avgOccupancyRaw
      : null

  const totalRoomsSold = sumField(rows, 'rooms_sold')

  const avgLaborRatioRaw = avgField(rows, 'labor_cost_ratio')
  const avgLaborRatio: number | null =
    avgLaborRatioRaw !== null
      ? avgLaborRatioRaw <= 1
        ? avgLaborRatioRaw * 100
        : avgLaborRatioRaw
      : null

  // ── Expense breakdown by category ─────────────────────────────────────────
  interface CategoryTotal {
    category: string
    total: number
  }

  const categoryMap = new Map<string, number>()
  for (const exp of expenseRows ?? []) {
    if (exp.amount === null) continue
    const key = exp.category ?? 'Uncategorized'
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + exp.amount)
  }

  const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const totalExpenseFromCategories = categoryTotals.reduce((s, c) => s + c.total, 0)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full space-y-8 p-6 text-vesta-navy">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-vesta-navy">Reports</h1>
          <p className="mt-1 text-vesta-navy/80">
            Monthly financial summary and performance data
            {hotel?.name ? ` for ${hotel.name}` : ''}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month navigator */}
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

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-vesta-navy/25 text-vesta-navy hover:border-vesta-gold/40 hover:bg-vesta-gold/10"
            disabled={!hasData}
            onClick={() => exportCsv(rows, selectedDate)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* No hotel */}
      {!hotelId && !hotelLoading && (
        <Card className="border border-vesta-navy/10 bg-white shadow-sm">
          <CardContent className="py-10 text-center">
            <UploadCloud className="mx-auto mb-3 h-8 w-8 text-vesta-navy-muted" />
            <p className="text-vesta-navy/80">No hotel linked to your account.</p>
            <p className="text-vesta-navy/65 text-sm mt-1">
              Ask your administrator to add you to a hotel.
            </p>
          </CardContent>
        </Card>
      )}

      {hotelId && (
        <>
          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-vesta-mist/50" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !hasData && (
            <Card className="border border-vesta-navy/10 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <UploadCloud className="h-10 w-10 text-vesta-navy-muted" />
                <p className="font-medium text-vesta-navy">No data for this month.</p>
                <p className="max-w-xs text-sm text-vesta-navy/80">
                  Connect an integration or upload a CSV to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Main content */}
          {!isLoading && hasData && (
            <div className="space-y-6">

              {/* ── Section 1: Monthly P&L Summary ─────────────────────────── */}
              <Card className="border border-vesta-navy/10 bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
                    <TrendingUp className="h-4 w-4 text-vesta-gold" />
                    Monthly P&amp;L Summary — {format(selectedDate, 'MMMM yyyy')}
                  </CardTitle>
                  <p className="text-xs text-vesta-navy/65">
                    {rows.length} day{rows.length !== 1 ? 's' : ''} of data
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                    {/* Left column — Revenue */}
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                        Revenue
                      </p>
                      <StatRow label="Room Revenue" value={fmtUsd(totalRoomRevenue)} />
                      <StatRow label="F&B Revenue" value={fmtUsd(totalFnbRevenue)} />
                      <StatRow label="Other Revenue (Spa + Other)" value={fmtUsd(totalOtherCombined)} />
                      <StatRow label="Total Revenue" value={fmtUsd(totalRevenue)} highlight />
                      <StatRow label="Total Expenses" value={fmtUsd(totalExpenses)} />
                      <StatRow label="GOP" value={fmtUsd(gop)} highlight />
                      <StatRow label="GOP Margin" value={fmtPct(gopMargin)} highlight />
                    </div>

                    {/* Right column — Operational KPIs */}
                    <div className="mt-6 md:mt-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                        Operational KPIs
                      </p>
                      <StatRow label="Average RevPAR" value={fmtUsd(avgRevpar)} />
                      <StatRow label="Average ADR" value={fmtUsd(avgAdr)} />
                      <StatRow label="Average Occupancy" value={fmtPct(avgOccupancy)} />
                      <StatRow label="Total Rooms Sold" value={fmtInt(totalRoomsSold)} />
                      <StatRow label="Avg Labor Cost Ratio" value={fmtPct(avgLaborRatio)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Section 2: Expense Breakdown ───────────────────────────── */}
              <Card className="border border-vesta-navy/10 bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
                    <Download className="h-4 w-4 text-vesta-gold" />
                    Expense Breakdown — {format(selectedDate, 'MMMM yyyy')}
                  </CardTitle>
                  <p className="text-xs text-vesta-navy/65">
                    By category, sorted by amount (largest first)
                  </p>
                </CardHeader>
                <CardContent>
                  {categoryTotals.length === 0 ? (
                    <p className="py-4 text-center text-sm text-vesta-navy/65">
                      No expense records for this month.
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {/* Header row */}
                      <div className="mb-1 flex items-center justify-between border-b border-vesta-navy/10 pb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                          Category
                        </span>
                        <div className="flex items-center gap-6">
                          <span className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            Amount
                          </span>
                          <span className="w-16 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            % of Total
                          </span>
                        </div>
                      </div>

                      {categoryTotals.map(({ category, total }) => {
                        const pct =
                          totalExpenseFromCategories > 0
                            ? (total / totalExpenseFromCategories) * 100
                            : 0
                        return (
                          <div
                            key={category}
                            className="flex items-center justify-between border-b border-vesta-navy/8 py-2.5 last:border-0"
                          >
                            <span className="text-sm text-vesta-navy/90">{category}</span>
                            <div className="flex items-center gap-6">
                              <span className="w-28 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                                {fmtUsd(total)}
                              </span>
                              <Badge className="w-16 justify-center border-vesta-navy/10 bg-vesta-mist/40 text-xs text-vesta-navy/90">
                                {pct.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        )
                      })}

                      {/* Total row */}
                      <div className="mt-1 flex items-center justify-between pt-3">
                        <span className="text-sm font-semibold text-vesta-navy">Total</span>
                        <div className="flex items-center gap-6">
                          <span className="w-28 text-right text-sm font-semibold tabular-nums text-vesta-gold">
                            {fmtUsd(totalExpenseFromCategories)}
                          </span>
                          <Badge className="w-16 justify-center border-vesta-gold/30 bg-vesta-gold/15 text-xs text-vesta-navy">
                            100%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Section 3: Daily Performance Table ────────────────────── */}
              <Card className="border border-vesta-navy/10 bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
                    <TrendingUp className="h-4 w-4 text-vesta-gold" />
                    Daily Performance — {format(selectedDate, 'MMMM yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-vesta-navy/10">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            Date
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            Rooms Sold
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            Occ%
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            ADR
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            RevPAR
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-vesta-navy/65">
                            GOP
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => {
                          const occVal =
                            row.occupancy_rate !== null
                              ? row.occupancy_rate <= 1
                                ? row.occupancy_rate * 100
                                : row.occupancy_rate
                              : null

                          return (
                            <tr
                              key={row.date}
                              className={`border-b border-vesta-navy/8 transition-colors last:border-0 hover:bg-vesta-mist/25 ${
                                idx % 2 === 0 ? '' : 'bg-vesta-mist/80'
                              }`}
                            >
                              <td className="whitespace-nowrap px-6 py-3 text-vesta-navy/90">
                                {format(new Date(row.date + 'T00:00:00'), 'EEE, MMM d')}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-vesta-navy">
                                {fmtInt(row.rooms_sold)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-vesta-navy">
                                {fmtPct(occVal)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-vesta-navy">
                                {fmtUsd(row.adr)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-vesta-navy">
                                {fmtUsd(row.revpar)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-vesta-navy">
                                {fmtUsd(row.total_revenue)}
                              </td>
                              <td className="px-6 py-3 text-right tabular-nums">
                                <span
                                  className={
                                    row.gop !== null
                                      ? row.gop >= 0
                                        ? 'text-emerald-700'
                                        : 'text-red-700'
                                      : 'text-vesta-navy/65'
                                  }
                                >
                                  {fmtUsd(row.gop)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>

                      {/* Totals / averages footer */}
                      <tfoot>
                        <tr className="border-t-2 border-vesta-navy/10 bg-vesta-mist/40">
                          <td className="px-6 py-3 text-xs font-semibold uppercase text-vesta-navy/80">
                            Month Total / Avg
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                            {fmtInt(totalRoomsSold)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                            {fmtPct(avgOccupancy)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                            {fmtUsd(avgAdr)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                            {fmtUsd(avgRevpar)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                            {fmtUsd(totalRevenue)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-semibold tabular-nums text-vesta-navy">
                            {fmtUsd(gop)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </>
      )}
    </div>
  )
}
