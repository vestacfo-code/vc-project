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
    <div className="flex items-center justify-between py-2.5 border-b border-gray-700/50 last:border-0">
      <span className={`text-sm ${highlight ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-amber-400' : 'text-white'}`}>
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
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reports</h1>
          <p className="text-slate-400 mt-1">
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
              className="h-9 w-9 border-gray-700 bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[130px] text-center">
              <p className="text-sm font-semibold text-white">
                {format(selectedDate, 'MMMM yyyy')}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-gray-700 bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/60 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-2"
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
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="py-10 text-center">
            <UploadCloud className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hotel linked to your account.</p>
            <p className="text-slate-500 text-sm mt-1">
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
                <div key={i} className="h-48 bg-gray-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !hasData && (
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <UploadCloud className="w-10 h-10 text-gray-600" />
                <p className="text-gray-300 font-medium">No data for this month.</p>
                <p className="text-gray-500 text-sm max-w-xs">
                  Connect an integration or upload a CSV to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Main content */}
          {!isLoading && hasData && (
            <div className="space-y-6">

              {/* ── Section 1: Monthly P&L Summary ─────────────────────────── */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Monthly P&amp;L Summary — {format(selectedDate, 'MMMM yyyy')}
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    {rows.length} day{rows.length !== 1 ? 's' : ''} of data
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                    {/* Left column — Revenue */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Download className="h-4 w-4 text-amber-400" />
                    Expense Breakdown — {format(selectedDate, 'MMMM yyyy')}
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    By category, sorted by amount (largest first)
                  </p>
                </CardHeader>
                <CardContent>
                  {categoryTotals.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      No expense records for this month.
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {/* Header row */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-700 mb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Category
                        </span>
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-28 text-right">
                            Amount
                          </span>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 text-right">
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
                            className="flex items-center justify-between py-2.5 border-b border-gray-700/40 last:border-0"
                          >
                            <span className="text-sm text-gray-300">{category}</span>
                            <div className="flex items-center gap-6">
                              <span className="text-sm font-semibold text-white tabular-nums w-28 text-right">
                                {fmtUsd(total)}
                              </span>
                              <Badge className="bg-gray-700/60 text-gray-300 border-gray-600 text-xs w-16 justify-center">
                                {pct.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        )
                      })}

                      {/* Total row */}
                      <div className="flex items-center justify-between pt-3 mt-1">
                        <span className="text-sm font-semibold text-gray-100">Total</span>
                        <div className="flex items-center gap-6">
                          <span className="text-sm font-semibold text-amber-400 tabular-nums w-28 text-right">
                            {fmtUsd(totalExpenseFromCategories)}
                          </span>
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs w-16 justify-center">
                            100%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Section 3: Daily Performance Table ────────────────────── */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Daily Performance — {format(selectedDate, 'MMMM yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Rooms Sold
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Occ%
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            ADR
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            RevPAR
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                              className={`border-b border-gray-700/40 last:border-0 transition-colors hover:bg-gray-700/20 ${
                                idx % 2 === 0 ? '' : 'bg-gray-800/20'
                              }`}
                            >
                              <td className="px-6 py-3 text-gray-300 whitespace-nowrap">
                                {format(new Date(row.date + 'T00:00:00'), 'EEE, MMM d')}
                              </td>
                              <td className="px-4 py-3 text-right text-white tabular-nums">
                                {fmtInt(row.rooms_sold)}
                              </td>
                              <td className="px-4 py-3 text-right text-white tabular-nums">
                                {fmtPct(occVal)}
                              </td>
                              <td className="px-4 py-3 text-right text-white tabular-nums">
                                {fmtUsd(row.adr)}
                              </td>
                              <td className="px-4 py-3 text-right text-white tabular-nums">
                                {fmtUsd(row.revpar)}
                              </td>
                              <td className="px-4 py-3 text-right text-white tabular-nums">
                                {fmtUsd(row.total_revenue)}
                              </td>
                              <td className="px-6 py-3 text-right tabular-nums">
                                <span
                                  className={
                                    row.gop !== null
                                      ? row.gop >= 0
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                      : 'text-gray-500'
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
                        <tr className="border-t-2 border-gray-600 bg-gray-800/60">
                          <td className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">
                            Month Total / Avg
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400 font-semibold tabular-nums">
                            {fmtInt(totalRoomsSold)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400 font-semibold tabular-nums">
                            {fmtPct(avgOccupancy)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400 font-semibold tabular-nums">
                            {fmtUsd(avgAdr)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400 font-semibold tabular-nums">
                            {fmtUsd(avgRevpar)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-400 font-semibold tabular-nums">
                            {fmtUsd(totalRevenue)}
                          </td>
                          <td className="px-6 py-3 text-right text-amber-400 font-semibold tabular-nums">
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
