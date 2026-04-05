import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type IntegrationRow = Database['public']['Tables']['integrations']['Row']
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { useSyncIntegration } from '@/hooks/useSyncIntegration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  RefreshCw,
  Plug,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  Upload,
  FileSpreadsheet,
  X,
  CreditCard,
  Mail,
} from 'lucide-react'
import { format, formatDistanceToNow, subDays } from 'date-fns'
import { toast } from 'sonner'
import {
  MEWS_DEMO_DOCS_URL,
  MEWS_DEMO_GROSS_TOKENS,
  MEWS_DEMO_PLATFORM_URL,
} from '@/lib/integrations/mews-demo'

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

/** QuickBooks is handled by the dedicated card above — avoid a duplicate “Connect” tile. */
const CONNECT_GRID_PROVIDERS = AVAILABLE_PROVIDERS.filter((p) => p.provider !== 'quickbooks')

/**
 * Stitch “Vesta Onyx” design system (Google Stitch MCP).
 * Project: projects/9952216724773843133 — Integrations & Billing Hub screen.
 */
const stitch = {
  page: 'min-h-screen bg-[#0e131f] text-[#dde2f3] p-6 md:p-10 space-y-10 font-[Inter,system-ui,sans-serif]',
  headline: "font-['Manrope',system-ui,sans-serif] text-3xl font-semibold tracking-tight text-[#dde2f3]",
  subtitle: 'mt-2 text-base text-[#d3c5ac] max-w-2xl leading-relaxed',
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9c8f79] font-['Manrope',system-ui,sans-serif]",
  sectionLabel: "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9c8f79] mb-4 font-['Manrope',system-ui,sans-serif]",
  card: 'rounded-2xl border-0 bg-[#1a202c] shadow-none ring-1 ring-white/[0.06]',
  cardMuted: 'rounded-2xl border-0 bg-[#161c28] shadow-none ring-1 ring-white/[0.04]',
  primaryBtn:
    'rounded-xl bg-gradient-to-br from-[#ffe1a7] to-[#fbbf24] text-[#402d00] font-semibold hover:opacity-95 border-0 shadow-sm',
  iconTile: 'rounded-xl bg-[#080e1a] ring-1 ring-white/[0.08]',
} as const

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

type StripeBillingStatus = {
  subscribed?: boolean
  has_stripe_subscription?: boolean
  subscription_tier?: string | null
  subscription_end?: string | null
  error?: string
}

export default function Integrations() {
  const navigate = useNavigate()
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

  const [mewsDialogOpen, setMewsDialogOpen] = useState(false)
  // Default to Mews-published Gross demo credentials (see mews-demo.ts) until production tokens are used.
  const [mewsClientToken, setMewsClientToken] = useState(MEWS_DEMO_GROSS_TOKENS.clientToken)
  const [mewsAccessToken, setMewsAccessToken] = useState(MEWS_DEMO_GROSS_TOKENS.accessToken)
  const [mewsPlatformUrl, setMewsPlatformUrl] = useState(MEWS_DEMO_PLATFORM_URL)
  const [mewsConnecting, setMewsConnecting] = useState(false)

  /** Which integration row is running a server-side sync (Mews / QuickBooks from list). */
  const [pmsSyncingId, setPmsSyncingId] = useState<string | null>(null)

  const [stripePortalLoading, setStripePortalLoading] = useState(false)
  const [resendTestLoading, setResendTestLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // OAuth callback detection — handles popup postMessage from QB redirect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Case 1: we ARE the popup (window.opener exists + QB params in URL)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const realmId = params.get('realmId')
    const state = params.get('state')

    if (code && realmId && state && window.opener) {
      // Tell the parent window to handle the callback, then close
      window.opener.postMessage({ type: 'QB_CALLBACK', code, realmId, state }, window.location.origin)
      window.close()
      return
    }

    // Case 2: we are the main window, listen for the popup's message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'QB_CALLBACK') return
      if (!hotelId) return

      const { code, realmId, state } = event.data
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
            queryClient.invalidateQueries({ queryKey: ['qb_integration', hotelId] })
            queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
          }
        })
        .finally(() => setQbCallbackLoading(false))
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
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

  const {
    data: stripeBilling,
    isLoading: stripeBillingLoading,
    isError: stripeBillingError,
    refetch: refetchStripeBilling,
  } = useQuery({
    queryKey: ['stripe-billing-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      if (error) throw error
      const body = data as StripeBillingStatus | null
      if (body?.error) throw new Error(body.error)
      return body
    },
    staleTime: 60_000,
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
      // Open in a popup so the main page session is never disrupted
      const popup = window.open(data.authUrl, 'qb_oauth', 'width=600,height=700,left=200,top=100')
      if (!popup) {
        // Fallback if popups are blocked
        window.location.href = data.authUrl
      }
    } catch (err) {
      toast.error('Failed to start QuickBooks connection')
    } finally {
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

  const handleResendTestEmail = async () => {
    setResendTestLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email')
      if (error) throw error
      const body = data as { success?: boolean; error?: string; email?: string } | null
      if (body?.error) throw new Error(body.error)
      if (body?.success) {
        toast.success(body.email ? `Test email sent to ${body.email}` : 'Test email sent')
      } else {
        throw new Error('Unexpected response from send-test-email')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send test email'
      toast.error(message)
    } finally {
      setResendTestLoading(false)
    }
  }

  const handleStripeCustomerPortal = async () => {
    setStripePortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal')
      if (error) {
        toast.error(error.message ?? 'Could not open Stripe billing portal')
        return
      }
      const body = data as { url?: string; error?: string } | null
      if (body?.error) {
        toast.error(body.error)
        return
      }
      if (body?.url) {
        window.open(body.url, '_blank', 'noopener,noreferrer')
        return
      }
      toast.error('Could not open billing portal')
    } finally {
      setStripePortalLoading(false)
    }
  }

  const handleConnectProvider = async (provider: string) => {
    if (!hotelId) {
      toast.error('No hotel found. Complete onboarding first.')
      return
    }
    if (provider === 'mews') {
      setMewsDialogOpen(true)
      return
    }
    if (provider === 'manual') {
      const { error } = await supabase.from('integrations').upsert(
        {
          hotel_id: hotelId,
          type: 'pms',
          provider: 'manual',
          credentials: {},
          status: 'active',
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hotel_id,provider' },
      )
      if (error) {
        toast.error('Could not enable manual entry: ' + error.message)
        return
      }
      toast.success('Manual entry enabled — use the dashboard and CSV import for data.')
      queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
      return
    }
    toast.info('Coming soon', {
      description: 'This integration is not available yet. Use CSV import or connect Mews.',
    })
  }

  const handleMewsSubmit = async () => {
    if (!hotelId) return
    const client = mewsClientToken.trim()
    const access = mewsAccessToken.trim()
    if (!client || !access) {
      toast.error('Client token and access token are required.')
      return
    }
    setMewsConnecting(true)
    try {
      const body: {
        hotel_id: string
        access_token: string
        client_token: string
        platform_url?: string
      } = {
        hotel_id: hotelId,
        access_token: access,
        client_token: client,
      }
      const pu = mewsPlatformUrl.trim()
      if (pu) body.platform_url = pu.replace(/\/$/, '')

      const { data, error } = await supabase.functions.invoke('mews-connect', { body })
      if (error) {
        toast.error(error.message ?? 'Mews connection failed')
        return
      }
      if (data && typeof data === 'object' && 'error' in data) {
        const msg =
          (data as { error?: string; details?: string }).details ??
          (data as { error?: string }).error ??
          'Mews connection failed'
        toast.error(msg)
        return
      }
      toast.success(
        (data as { hotel_name_from_mews?: string })?.hotel_name_from_mews
          ? `Connected to Mews: ${(data as { hotel_name_from_mews: string }).hotel_name_from_mews}`
          : 'Mews connected successfully',
      )
      setMewsDialogOpen(false)
      setMewsClientToken(MEWS_DEMO_GROSS_TOKENS.clientToken)
      setMewsAccessToken(MEWS_DEMO_GROSS_TOKENS.accessToken)
      setMewsPlatformUrl(MEWS_DEMO_PLATFORM_URL)
      queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
      queryClient.invalidateQueries({ queryKey: ['sync_logs', hotelId] })
    } finally {
      setMewsConnecting(false)
    }
  }

  const handleIntegrationSync = async (integration: IntegrationRow) => {
    if (!hotelId) return
    const { id, provider } = integration

    if (provider === 'mews') {
      setPmsSyncingId(id)
      try {
        const toDate = format(new Date(), 'yyyy-MM-dd')
        const fromDate = format(subDays(new Date(), 7), 'yyyy-MM-dd')
        const { data, error } = await supabase.functions.invoke('mews-sync', {
          body: { hotel_id: hotelId, from_date: fromDate, to_date: toDate },
        })
        if (error) {
          toast.error(error.message ?? 'Mews sync failed')
          return
        }
        if (data && typeof data === 'object' && 'error' in data) {
          const msg =
            (data as { details?: string; error?: string }).details ??
            (data as { error?: string }).error ??
            'Mews sync failed'
          toast.error(msg)
          return
        }
        const synced = (data as { records_synced?: number })?.records_synced ?? 0
        toast.success(`Synced ${synced} day(s) of metrics from Mews`)
        queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
        queryClient.invalidateQueries({ queryKey: ['sync_logs', hotelId] })
        queryClient.invalidateQueries({ queryKey: ['daily_metrics'] })
      } finally {
        setPmsSyncingId(null)
      }
      return
    }

    if (provider === 'quickbooks') {
      setPmsSyncingId(id)
      try {
        const { data, error } = await supabase.functions.invoke('quickbooks-hotel-sync', {
          body: { hotel_id: hotelId },
        })
        if (error) {
          toast.error(error.message ?? 'QuickBooks sync failed')
          return
        }
        if (data && typeof data === 'object' && 'error' in data) {
          toast.error((data as { error?: string }).error ?? 'QuickBooks sync failed')
          return
        }
        toast.success(`Synced ${(data as { synced_count?: number })?.synced_count ?? 0} expenses from QuickBooks`)
        queryClient.invalidateQueries({ queryKey: ['qb_integration', hotelId] })
        queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
      } finally {
        setPmsSyncingId(null)
      }
      return
    }

    sync({
      integrationId: integration.id,
      hotelId,
      provider: integration.provider,
      credentials: (integration.credentials as Record<string, string>) ?? {},
    })
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
    <div className={stitch.page}>
      {/* Header — Stitch “Vesta Onyx” */}
      <header className="space-y-1">
        <p className={stitch.eyebrow}>Workspace</p>
        <h1 className={stitch.headline}>Integrations</h1>
        <p className={stitch.subtitle}>
          Connect your property management system, accounting tools, and Vesta billing — one hub for sync and
          subscription management.
        </p>
      </header>

      <section aria-label="Accounting and billing" className="space-y-6">
      {/* QuickBooks OAuth card */}
      {qbCallbackLoading ? (
        <div className="h-32 bg-[#161c28] rounded-2xl animate-pulse flex items-center justify-center ring-1 ring-white/[0.06]">
          <RefreshCw className="w-6 h-6 text-[#9c8f79] animate-spin" />
          <span className="ml-3 text-[#d3c5ac]">Connecting QuickBooks...</span>
        </div>
      ) : (
        <Card className={`${stitch.card} border-l-4 border-l-emerald-500`}>
          <CardContent className="p-6 md:px-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Logo + title area */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-900/40 border border-green-700/40 flex items-center justify-center shrink-0">
                  <span className="text-green-400 font-bold text-sm">QB</span>
                </div>
                <div>
                  <p className="font-medium text-[#dde2f3] font-['Manrope',system-ui,sans-serif]">QuickBooks Online</p>
                  <p className="text-[#d3c5ac] text-sm mt-0.5">Sync expenses &amp; P&amp;L data automatically</p>
                </div>
              </div>

              {/* Action area */}
              {qbLoading ? (
                <div className="flex gap-2">
                  <div className="h-9 w-28 bg-[#242a36] rounded-xl animate-pulse" />
                </div>
              ) : qbIntegration ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <span className="text-[#9c8f79] text-xs">
                    {qbIntegration.last_sync_at
                      ? `Synced ${formatDistanceToNow(new Date(qbIntegration.last_sync_at), { addSuffix: true })}`
                      : 'Never synced'}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleQBSync}
                    disabled={qbSyncing}
                    className={`${stitch.primaryBtn} disabled:opacity-50`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${qbSyncing ? 'animate-spin' : ''}`} />
                    {qbSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQBDisconnect}
                    className="rounded-xl border-red-400/30 text-red-300/90 hover:bg-red-500/10 bg-transparent"
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
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
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
                  <p className="text-[#9c8f79] text-xs">Requires QuickBooks Online subscription</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stripe — Vesta subscription & billing portal */}
      <Card className={`${stitch.card} border-l-4 border-l-violet-500`}>
        <CardContent className="p-6 md:px-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-900/40 border border-violet-700/40 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-violet-300" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-[#dde2f3] font-['Manrope',system-ui,sans-serif]">Stripe billing</p>
                <p className="text-[#d3c5ac] text-sm mt-0.5">
                  Your Vesta plan is processed by Stripe — update payment method, invoices, and subscription here.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {stripeBillingLoading ? (
                <div className="h-9 w-40 bg-[#242a36] rounded-xl animate-pulse" />
              ) : stripeBillingError ? (
                <div className="text-right space-y-2">
                  <p className="text-red-300/90 text-xs">Could not load subscription status.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-white/10 bg-[#242a36] text-[#d3c5ac]"
                    onClick={() => refetchStripeBilling()}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  {stripeBilling?.subscribed && (
                    <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {stripeBilling.has_stripe_subscription ? 'Active Stripe subscription' : 'Subscribed'}
                    </Badge>
                  )}
                  {stripeBilling?.subscription_tier && (
                    <span className="text-[#9c8f79] text-xs text-right max-w-[220px]">
                      {stripeBilling.subscription_tier}
                      {stripeBilling.subscription_end
                        ? ` · Renews ${format(new Date(stripeBilling.subscription_end), 'MMM d, yyyy')}`
                        : ''}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-violet-400/25 text-violet-200 hover:bg-violet-500/10 bg-[#242a36]/50"
                      disabled={stripePortalLoading}
                      onClick={handleStripeCustomerPortal}
                    >
                      {stripePortalLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Opening…
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          Manage billing
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className={`${stitch.primaryBtn}`}
                      onClick={() => navigate('/pricing')}
                    >
                      View plans
                    </Button>
                  </div>
                  {!stripeBilling?.subscribed && !stripeBillingLoading && (
                    <p className="text-[#9c8f79] text-xs text-right">No active subscription — choose a plan on Pricing.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resend — transactional email (password reset, billing, alerts) */}
      <Card className={`${stitch.card} border-l-4 border-l-sky-500`}>
        <CardContent className="p-6 md:px-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-900/40 border border-sky-700/40 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-sky-300" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-[#dde2f3] font-['Manrope',system-ui,sans-serif]">Email (Resend)</p>
                <p className="text-[#d3c5ac] text-sm mt-0.5 max-w-xl">
                  Password resets, subscription notices, and system alerts are sent through Resend. In Supabase, set{' '}
                  <span className="text-[#dde2f3] font-mono text-xs">RESEND_API_KEY</span> and optionally{' '}
                  <span className="text-[#dde2f3] font-mono text-xs">RESEND_FROM</span> (verified domain) for Edge
                  Functions.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                className={`${stitch.primaryBtn}`}
                disabled={resendTestLoading}
                onClick={handleResendTestEmail}
              >
                {resendTestLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Send test email
                  </>
                )}
              </Button>
              <p className="text-[#9c8f79] text-xs text-right max-w-[240px]">
                Delivers to your signed-in account email to confirm the integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </section>

      <Dialog open={mewsDialogOpen} onOpenChange={setMewsDialogOpen}>
        <DialogContent className="bg-[#161c28] border-0 text-[#dde2f3] sm:max-w-md ring-1 ring-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Connect Mews</DialogTitle>
            <DialogDescription className="text-[#d3c5ac]">
              Fields default to Mews&apos;s <span className="text-[#dde2f3]">published Gross demo</span> tokens and{' '}
              <span className="text-[#dde2f3]">{MEWS_DEMO_PLATFORM_URL}</span>. Replace with production{' '}
              <span className="text-[#dde2f3]">https://api.mews.com</span> and your certified tokens when ready.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-[#fbbf24]/20 bg-[#fbbf24]/[0.05] px-3 py-3 space-y-2">
            <p className="text-xs text-[#d3c5ac] leading-relaxed">
              <span className="text-[#ffe1a7] font-medium">Integration testing:</span> Mews publishes public demo
              credentials (Gross pricing environment). Do not put real guest or payment data in demo.{' '}
              <a
                href={MEWS_DEMO_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#fbbf24] underline underline-offset-2 hover:text-[#ffe1a7]"
              >
                Mews environment docs
              </a>
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full rounded-xl bg-[#242a36] text-[#ffe1a7] border border-white/10 hover:bg-[#2f3542]"
              onClick={() => {
                setMewsPlatformUrl(MEWS_DEMO_PLATFORM_URL)
                setMewsClientToken(MEWS_DEMO_GROSS_TOKENS.clientToken)
                setMewsAccessToken(MEWS_DEMO_GROSS_TOKENS.accessToken)
                toast.info('Reset to published demo credentials')
              }}
            >
              Reset to demo credentials
            </Button>
          </div>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mews-client-token" className="text-[#d3c5ac]">
                Client token
              </Label>
              <Input
                id="mews-client-token"
                type="password"
                autoComplete="off"
                placeholder="Client token"
                value={mewsClientToken}
                onChange={(e) => setMewsClientToken(e.target.value)}
                className="rounded-xl bg-[#080e1a] border-white/10 text-[#dde2f3]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mews-access-token" className="text-[#d3c5ac]">
                Access token
              </Label>
              <Input
                id="mews-access-token"
                type="password"
                autoComplete="off"
                placeholder="Access token"
                value={mewsAccessToken}
                onChange={(e) => setMewsAccessToken(e.target.value)}
                className="rounded-xl bg-[#080e1a] border-white/10 text-[#dde2f3]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mews-platform-url" className="text-[#d3c5ac]">
                Platform URL <span className="text-[#9c8f79] font-normal">(optional)</span>
              </Label>
              <Input
                id="mews-platform-url"
                type="url"
                placeholder="https://api.mews.com"
                value={mewsPlatformUrl}
                onChange={(e) => setMewsPlatformUrl(e.target.value)}
                className="rounded-xl bg-[#080e1a] border-white/10 text-[#dde2f3]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/10 text-[#d3c5ac] bg-transparent"
              onClick={() => setMewsDialogOpen(false)}
              disabled={mewsConnecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={stitch.primaryBtn}
              disabled={mewsConnecting}
              onClick={handleMewsSubmit}
            >
              {mewsConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Connecting…
                </>
              ) : (
                'Verify & connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connected integrations */}
      <section aria-label="Connected integrations">
        <h2 className={stitch.sectionLabel}>Connected</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-[#161c28] rounded-2xl animate-pulse ring-1 ring-white/[0.05]" />
            ))}
          </div>
        ) : integrations.length === 0 ? (
          <Card className={stitch.cardMuted}>
            <CardContent className="py-12 text-center">
              <WifiOff className="w-8 h-8 text-[#9c8f79] mx-auto mb-3" />
              <p className="text-[#d3c5ac]">No integrations connected yet.</p>
              <p className="text-[#9c8f79] text-sm mt-1">Connect a PMS below to start syncing data.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => {
              const cfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const recentLogs = syncLogs.filter((l) => l.integration_id === integration.id).slice(0, 5)

              return (
                <Card key={integration.id} className={stitch.card}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 ${stitch.iconTile} flex items-center justify-center`}>
                          <Wifi className="w-5 h-5 text-[#d3c5ac]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#dde2f3] font-['Manrope',system-ui,sans-serif]">
                              {PROVIDER_LABELS[integration.provider] ?? integration.provider}
                            </span>
                            <Badge className={`text-xs border ${cfg.badge}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-[#d3c5ac] text-sm mt-0.5">
                            {integration.last_sync_at
                              ? `Last synced ${formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}`
                              : 'Never synced'}
                          </p>
                          {integration.error_message && (
                            <p className="text-red-300/90 text-xs mt-1">{integration.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-white/10 text-[#ffe1a7] bg-[#242a36]/60 hover:bg-[#2f3542] shrink-0"
                        disabled={isSyncing || pmsSyncingId === integration.id}
                        onClick={() => handleIntegrationSync(integration)}
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 mr-1.5 ${
                            isSyncing || pmsSyncingId === integration.id ? 'animate-spin' : ''
                          }`}
                        />
                        Sync Now
                      </Button>
                    </div>

                    {/* Recent sync history */}
                    {recentLogs.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-white/[0.06]">
                        <p className="text-xs text-[#9c8f79] mb-2">Recent syncs</p>
                        <div className="space-y-1.5">
                          {recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={
                                  log.status === 'success' ? 'text-emerald-400' :
                                  log.status === 'failed' ? 'text-red-400' :
                                  log.status === 'partial' ? 'text-amber-300' : 'text-[#9c8f79]'
                                }>
                                  {log.status}
                                </span>
                                <span className="text-[#9c8f79]">
                                  {log.records_synced} records
                                </span>
                              </div>
                              <span className="text-[#9c8f79]/70">
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
      </section>

      {/* Available providers */}
      <section aria-label="Connect new integrations">
        <h2 className={stitch.sectionLabel}>Connect new</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONNECT_GRID_PROVIDERS.filter((p) => !connectedProviders.has(p.provider)).map((p) => (
            <Card
              key={p.provider}
              className={`${stitch.cardMuted} hover:bg-[#1a202c]/90 transition-colors group`}
            >
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-[#dde2f3] font-['Manrope',system-ui,sans-serif]">
                    {p.label}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-white/10 text-[#9c8f79] bg-transparent">
                    {p.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-[#d3c5ac] text-xs leading-relaxed">{p.description}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-4 w-full rounded-xl text-[#fbbf24] hover:text-[#ffe1a7] hover:bg-[#fbbf24]/10 border border-[#fbbf24]/25"
                  disabled={!hotelId || (p.provider === 'mews' && mewsConnecting)}
                  onClick={() => handleConnectProvider(p.provider)}
                >
                  <Plug className="w-3.5 h-3.5 mr-1.5" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Import Data section                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Import CSV data">
        <h2 className={stitch.sectionLabel}>Import data</h2>

        <Card className={stitch.card}>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Drag-and-drop / file picker */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3
                rounded-2xl border-2 border-dashed px-6 py-12
                transition-colors
                ${selectedFile
                  ? 'border-[#fbbf24]/45 bg-[#fbbf24]/[0.06] cursor-default'
                  : dragActive
                    ? 'border-[#fbbf24]/70 bg-[#fbbf24]/10 cursor-copy'
                    : 'border-[#fbbf24]/35 hover:border-[#fbbf24]/55 bg-[#080e1a]/50 hover:bg-[#161c28] cursor-pointer'
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
                    <p className="text-sm font-medium text-[#dde2f3]">{selectedFile.name}</p>
                    <p className="text-xs text-[#9c8f79] mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                    className="ml-2 p-1 rounded-md text-[#9c8f79] hover:text-[#dde2f3] hover:bg-[#242a36] transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-xl ${stitch.iconTile} flex items-center justify-center`}>
                    <Upload className="w-6 h-6 text-[#9c8f79]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#dde2f3]">
                      Drop a CSV file here, or{' '}
                      <span className="text-[#fbbf24] hover:text-[#ffe1a7] underline underline-offset-2">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-[#9c8f79] mt-1">Only .csv files are accepted</p>
                  </div>
                </>
              )}
            </div>

            {/* Data type selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-[#9c8f79] mb-1.5">Data type</label>
                <Select
                  value={importType}
                  onValueChange={(val) => setImportType(val as ImportType)}
                >
                  <SelectTrigger className="rounded-xl bg-[#080e1a] border-white/10 text-[#dde2f3] focus:ring-[#fbbf24]/25">
                    <SelectValue placeholder="Select data type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a202c] border-white/10 text-[#dde2f3]">
                    {(Object.keys(IMPORT_TYPE_LABELS) as ImportType[]).map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="focus:bg-[#242a36] focus:text-[#dde2f3]"
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
                  className={`${stitch.primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto rounded-xl`}
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
            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-xs text-[#9c8f79]">
                Download sample CSVs:{' '}
                {(Object.keys(SAMPLE_CSV_PATHS) as ImportType[]).map((type, idx, arr) => (
                  <span key={type}>
                    <a
                      href={SAMPLE_CSV_PATHS[type]}
                      download
                      className="text-[#fbbf24]/90 hover:text-[#ffe1a7] underline underline-offset-2 transition-colors"
                    >
                      {IMPORT_TYPE_LABELS[type]}
                    </a>
                    {idx < arr.length - 1 && <span className="text-[#9c8f79]/50">{' · '}</span>}
                  </span>
                ))}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
