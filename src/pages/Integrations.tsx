import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { useSyncIntegration } from '@/hooks/useSyncIntegration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Plug, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff, Upload, FileSpreadsheet, X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_LABELS: Record<string, string> = {
  mews: 'Mews',
  cloudbeds: 'Cloudbeds',
  opera: 'Oracle Opera',
  apaleo: 'Apaleo',
  protel: 'Protel',
  quickbooks: 'QuickBooks',
  plaid: 'Plaid',
  manual: 'Manual Entry',
}

const STATUS_CONFIG = {
  active: { label: 'Active', icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  disconnected: { label: 'Disconnected', icon: WifiOff, color: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

const AVAILABLE_PROVIDERS = [
  { provider: 'mews', label: 'Mews', type: 'pms', description: 'Cloud PMS — sync reservations, revenue & occupancy' },
  { provider: 'cloudbeds', label: 'Cloudbeds', type: 'pms', description: 'All-in-one PMS — sync daily metrics & channel data' },
  { provider: 'opera', label: 'Oracle Opera', type: 'pms', description: 'Enterprise PMS — sync revenue & occupancy' },
  { provider: 'quickbooks', label: 'QuickBooks', type: 'accounting', description: 'Sync expenses & P&L data' },
  { provider: 'manual', label: 'Manual Entry', type: 'pms', description: 'Enter daily metrics directly in Vesta' },
]

type ImportType = 'daily_metrics' | 'expenses' | 'revenue_by_channel'

const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  daily_metrics: 'Daily Metrics',
  expenses: 'Expenses',
  revenue_by_channel: 'Revenue by Channel',
}

const SAMPLE_CSV_PATHS: Record<ImportType, string> = {
  daily_metrics: '/sample-data/daily_metrics.csv',
  expenses: '/sample-data/expenses.csv',
  revenue_by_channel: '/sample-data/revenue_by_channel.csv',
}

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim().length > 0)
  if (nonEmpty.length < 2) return { headers: [], rows: [] }

  const headers = nonEmpty[0].split(',').map((h) => h.trim())
  const rows = nonEmpty.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    return row
  })

  return { headers, rows }
}

function num(val: string | undefined): number | null {
  if (val === undefined || val === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function bool(val: string | undefined): boolean {
  return val === 'true'
}

function str(val: string | undefined): string | null {
  if (val === undefined || val === '') return null
  return val
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function mapDailyMetrics(row: Record<string, string>, hotelId: string) {
  return {
    hotel_id: hotelId,
    date: row['date'],
    rooms_available: num(row['rooms_available']),
    rooms_out_of_order: num(row['rooms_out_of_order']),
    rooms_sold: num(row['rooms_sold']),
    occupancy_rate: num(row['occupancy_rate']),
    adr: num(row['adr']),
    revpar: num(row['revpar']),
    room_revenue: num(row['room_revenue']),
    fnb_revenue: num(row['fnb_revenue']),
    spa_revenue: num(row['spa_revenue']),
    other_revenue: num(row['other_revenue']),
    total_revenue: num(row['total_revenue']),
    labor_cost: num(row['labor_cost']),
    labor_cost_ratio: num(row['labor_cost_ratio']),
    total_expenses: num(row['total_expenses']),
    gop: num(row['gop']),
    gop_margin: num(row['gop_margin']),
    goppar: num(row['goppar']),
    data_source: str(row['data_source']),
  }
}

function mapExpenses(row: Record<string, string>, hotelId: string) {
  return {
    hotel_id: hotelId,
    date: row['date'],
    category: str(row['category']),
    subcategory: str(row['subcategory']),
    amount: num(row['amount']),
    vendor: str(row['vendor']),
    is_recurring: bool(row['is_recurring']),
    source: str(row['source']),
  }
}

function mapRevenueByChannel(row: Record<string, string>, hotelId: string) {
  return {
    hotel_id: hotelId,
    date: row['date'],
    channel: row['channel'],
    room_nights: num(row['room_nights']),
    bookings_count: num(row['bookings_count']),
    revenue: num(row['revenue']),
    commission_rate: num(row['commission_rate']),
    commission_amount: num(row['commission_amount']),
    net_revenue: num(row['net_revenue']),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Integrations() {
  const { hotelId } = useHotelDashboard()
  const { sync, isSyncing } = useSyncIntegration()
  const queryClient = useQueryClient()

  // CSV import state
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<ImportType | ''>('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // QuickBooks state
  const [qbConnecting, setQbConnecting] = useState(false)
  const [qbSyncing, setQbSyncing] = useState(false)
  const [qbCallbackLoading, setQbCallbackLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // OAuth callback detection
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const realmId = params.get('realmId')
    const state = params.get('state')

    if (code && realmId && state && state.startsWith('hotelId') && hotelId) {
      setQbCallbackLoading(true)
      supabase.functions
        .invoke('quickbooks-hotel-oauth', {
          body: { action: 'callback', hotel_id: hotelId, code, realm_id: realmId, state },
        })
        .then(({ error }) => {
          if (error) {
            toast.error('Failed to connect QuickBooks: ' + error.message)
          } else {
            toast.success('QuickBooks connected!')
            window.history.replaceState({}, '', '/integrations')
            queryClient.invalidateQueries({ queryKey: ['qb_integration', hotelId] })
            queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
          }
        })
        .finally(() => setQbCallbackLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId])

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!hotelId,
  })

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync_logs', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('started_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: !!hotelId,
  })

  const { data: qbIntegration, isLoading: qbLoading } = useQuery({
    queryKey: ['qb_integration', hotelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('provider', 'quickbooks')
        .maybeSingle()
      return data
    },
    enabled: !!hotelId,
  })

  const connectedProviders = new Set(integrations.map((i) => i.provider))

  // ---------------------------------------------------------------------------
  // QuickBooks handlers
  // ---------------------------------------------------------------------------

  const handleQBConnect = async () => {
    setQbConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-hotel-oauth', {
        body: { action: 'authorize', hotel_id: hotelId },
      })
      if (error) throw error
      window.location.href = data.authUrl
    } catch (err) {
      toast.error('Failed to start QuickBooks connection')
      setQbConnecting(false)
    }
  }

  const handleQBDisconnect = async () => {
    await supabase.functions.invoke('quickbooks-hotel-oauth', {
      body: { action: 'disconnect', hotel_id: hotelId },
    })
    queryClient.invalidateQueries({ queryKey: ['qb_integration', hotelId] })
    toast.success('QuickBooks disconnected')
  }

  const handleQBSync = async () => {
    setQbSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-hotel-sync', {
        body: { hotel_id: hotelId },
      })
      if (error) throw error
      toast.success(`Synced ${data.synced_count} expenses from QuickBooks`)
      queryClient.invalidateQueries({ queryKey: ['qb_integration', hotelId] })
    } catch (err) {
      toast.error('QuickBooks sync failed')
    } finally {
      setQbSyncing(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Drag-and-drop handlers
  // ---------------------------------------------------------------------------

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
    } else {
      toast.error('Please drop a valid .csv file.')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
    // Reset so the same file can be re-selected after removal
    e.target.value = ''
  }

  function handleRemoveFile() {
    setSelectedFile(null)
  }

  // ---------------------------------------------------------------------------
  // Import handler
  // ---------------------------------------------------------------------------

  async function handleImport() {
    if (!selectedFile) {
      toast.error('Please select a CSV file.')
      return
    }
    if (!importType) {
      toast.error('Please select a data type to import.')
      return
    }
    if (!hotelId) {
      toast.error('No hotel found. Please complete onboarding first.')
      return
    }

    setIsImporting(true)

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(selectedFile)
      })

      const { rows } = parseCSV(text)
      const nonEmptyRows = rows.filter((r) => Object.values(r).some((v) => v !== ''))

      if (nonEmptyRows.length === 0) {
        toast.error('The CSV file contains no data rows.')
        setIsImporting(false)
        return
      }

      toast.loading(`Importing ${nonEmptyRows.length} rows...`, { id: 'csv-import' })

      if (importType === 'daily_metrics') {
        const payload = nonEmptyRows.map((r) => mapDailyMetrics(r, hotelId))
        const { error } = await supabase
          .from('daily_metrics')
          .upsert(payload, { onConflict: 'hotel_id,date' })
        if (error) throw error
      } else if (importType === 'expenses') {
        const payload = nonEmptyRows.map((r) => mapExpenses(r, hotelId))
        const { error } = await supabase.from('expenses').insert(payload)
        if (error) throw error
      } else if (importType === 'revenue_by_channel') {
        const payload = nonEmptyRows.map((r) => mapRevenueByChannel(r, hotelId))
        const { error } = await supabase
          .from('revenue_by_channel')
          .upsert(payload, { onConflict: 'hotel_id,date,channel' })
        if (error) throw error
      }

      toast.success(`Imported ${nonEmptyRows.length} rows successfully`, { id: 'csv-import' })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['daily_metrics'] })
      queryClient.invalidateQueries({ queryKey: ['sync_logs'] })

      // Reset form
      setSelectedFile(null)
      setImportType('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      toast.error(`Import failed: ${message}`, { id: 'csv-import' })
    } finally {
      setIsImporting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Integrations</h1>
        <p className="text-slate-400 mt-1">Connect your PMS and accounting systems to sync data automatically.</p>
      </div>

      {/* QuickBooks OAuth card */}
      {qbCallbackLoading ? (
        <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          <span className="ml-3 text-slate-400">Connecting QuickBooks...</span>
        </div>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700 border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Logo + title area */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-900/40 border border-green-700/40 flex items-center justify-center shrink-0">
                  <span className="text-green-400 font-bold text-sm">QB</span>
                </div>
                <div>
                  <p className="font-medium text-white">QuickBooks Online</p>
                  <p className="text-slate-400 text-sm mt-0.5">Sync expenses &amp; P&amp;L data automatically</p>
                </div>
              </div>

              {/* Action area */}
              {qbLoading ? (
                <div className="flex gap-2">
                  <div className="h-9 w-28 bg-gray-700 rounded-md animate-pulse" />
                </div>
              ) : qbIntegration ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <span className="text-slate-500 text-xs">
                    {qbIntegration.last_sync_at
                      ? `Synced ${formatDistanceToNow(new Date(qbIntegration.last_sync_at), { addSuffix: true })}`
                      : 'Never synced'}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleQBSync}
                    disabled={qbSyncing}
                    className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${qbSyncing ? 'animate-spin' : ''}`} />
                    {qbSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQBDisconnect}
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleQBConnect}
                    disabled={qbConnecting || !hotelId}
                    className="bg-green-600 hover:bg-green-500 text-white font-semibold disabled:opacity-50"
                  >
                    {qbConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plug className="w-3.5 h-3.5 mr-1.5" />
                        Connect QuickBooks
                      </>
                    )}
                  </Button>
                  <p className="text-slate-500 text-xs">Requires QuickBooks Online subscription</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected integrations */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Connected</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse" />)}
          </div>
        ) : integrations.length === 0 ? (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="py-10 text-center">
              <WifiOff className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No integrations connected yet.</p>
              <p className="text-slate-500 text-sm mt-1">Connect a PMS below to start syncing data.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => {
              const cfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const recentLogs = syncLogs.filter((l) => l.integration_id === integration.id).slice(0, 5)

              return (
                <Card key={integration.id} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {PROVIDER_LABELS[integration.provider] ?? integration.provider}
                            </span>
                            <Badge className={`text-xs border ${cfg.badge}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mt-0.5">
                            {integration.last_sync_at
                              ? `Last synced ${formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}`
                              : 'Never synced'}
                          </p>
                          {integration.error_message && (
                            <p className="text-red-400 text-xs mt-1">{integration.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-slate-300 hover:bg-gray-700 shrink-0"
                        disabled={isSyncing}
                        onClick={() =>
                          sync({
                            integrationId: integration.id,
                            hotelId: hotelId!,
                            provider: integration.provider,
                            credentials: (integration.credentials as Record<string, string>) ?? {},
                          })
                        }
                      >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Now
                      </Button>
                    </div>

                    {/* Recent sync history */}
                    {recentLogs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-slate-500 mb-2">Recent syncs</p>
                        <div className="space-y-1.5">
                          {recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={
                                  log.status === 'success' ? 'text-emerald-400' :
                                  log.status === 'failed' ? 'text-red-400' :
                                  log.status === 'partial' ? 'text-amber-400' : 'text-slate-400'
                                }>
                                  {log.status}
                                </span>
                                <span className="text-slate-500">
                                  {log.records_synced} records
                                </span>
                              </div>
                              <span className="text-slate-600">
                                {format(new Date(log.started_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Available providers */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Connect New</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVAILABLE_PROVIDERS.filter((p) => !connectedProviders.has(p.provider)).map((p) => (
            <Card
              key={p.provider}
              className="bg-gray-800/30 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-all cursor-pointer group"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">{p.label}</CardTitle>
                  <Badge variant="outline" className="text-xs border-gray-600 text-slate-500">
                    {p.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-slate-400 text-xs">{p.description}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 w-full text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-400/20 hover:border-amber-400/40"
                >
                  <Plug className="w-3.5 h-3.5 mr-1.5" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Import Data section                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Import Data</h2>

        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-6 space-y-5">
            {/* Drag-and-drop / file picker */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3
                rounded-xl border-2 border-dashed px-6 py-10
                transition-colors
                ${selectedFile
                  ? 'border-amber-500/40 bg-amber-500/5 cursor-default'
                  : dragActive
                    ? 'border-amber-400/60 bg-amber-400/10 cursor-copy'
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/40 cursor-pointer'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                    className="ml-2 p-1 rounded-md text-slate-500 hover:text-white hover:bg-gray-700 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gray-700/60 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">
                      Drop a CSV file here, or{' '}
                      <span className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Only .csv files are accepted</p>
                  </div>
                </>
              )}
            </div>

            {/* Data type selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1.5">Data type</label>
                <Select
                  value={importType}
                  onValueChange={(val) => setImportType(val as ImportType)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:ring-amber-400/30 focus:border-amber-400/50">
                    <SelectValue placeholder="Select data type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {(Object.keys(IMPORT_TYPE_LABELS) as ImportType[]).map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="focus:bg-gray-700 focus:text-white"
                      >
                        {IMPORT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Import button */}
              <div className="flex items-end">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !selectedFile || !importType || !hotelId}
                  className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sample CSV links */}
            <div className="pt-1 border-t border-gray-700/60">
              <p className="text-xs text-slate-500">
                Download sample CSVs:{' '}
                {(Object.keys(SAMPLE_CSV_PATHS) as ImportType[]).map((type, idx, arr) => (
                  <span key={type}>
                    <a
                      href={SAMPLE_CSV_PATHS[type]}
                      download
                      className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2 transition-colors"
                    >
                      {IMPORT_TYPE_LABELS[type]}
                    </a>
                    {idx < arr.length - 1 && <span className="text-slate-600">{' · '}</span>}
                  </span>
                ))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
