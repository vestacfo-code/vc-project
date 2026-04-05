import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type IntegrationRow = Database['public']['Tables']['integrations']['Row']
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import {
  fetchHotelIntegrations,
  fetchHotelQuickBooksIntegration,
  hotelIntegrationsQueryKey,
  qbIntegrationQueryKey,
  refreshQuickBooksIntegrationQueries,
} from '@/lib/hotel-integrations-queries'
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
} from 'lucide-react'
import { format, formatDistanceToNow, subDays, subHours } from 'date-fns'
import { toast } from 'sonner'
import {
  MEWS_DEMO_DOCS_URL,
  MEWS_DEMO_GROSS_TOKENS,
  MEWS_DEMO_PLATFORM_URL,
} from '@/lib/integrations/mews-demo'
import {
  isHotelQuickBooksOAuthRedirect,
  parseQuickBooksOAuthCallbackParams,
} from '@/lib/quickbooks-oauth-params'
import { parseHotelIdFromQuickBooksState } from '@/lib/supabase-third-party-oauth'
import quickbooksLogo from '@/assets/quickbooks-logo.png'

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

/** Status badge for PMS / manual rows (QuickBooks uses the dedicated card above, not this list). */
const STATUS_CONFIG = {
  active: { label: 'Active', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  pending: { label: 'Pending', icon: Clock, badge: 'bg-amber-50 text-amber-900 border-amber-200' },
  error: { label: 'Error', icon: AlertCircle, badge: 'bg-red-50 text-red-800 border-red-200' },
  disconnected: { label: 'Disconnected', icon: WifiOff, badge: 'bg-vesta-mist/60 text-vesta-navy-muted border-vesta-navy/15' },
}

const AVAILABLE_PROVIDERS = [
  { provider: 'mews', label: 'Mews', type: 'pms', description: 'Cloud PMS — sync reservations, revenue & occupancy' },
  { provider: 'cloudbeds', label: 'Cloudbeds', type: 'pms', description: 'All-in-one PMS — sync daily metrics & channel data' },
  { provider: 'opera', label: 'Oracle Opera', type: 'pms', description: 'Enterprise PMS — sync revenue & occupancy' },
  { provider: 'quickbooks', label: 'QuickBooks', type: 'accounting', description: 'Sync expenses & P&L data' },
  { provider: 'manual', label: 'Manual Entry', type: 'pms', description: 'Enter daily metrics directly in Vesta' },
]

/**
 * QuickBooks: dedicated card above — no duplicate tile.
 * Cloudbeds: hidden until the API integration is built (re-add by removing the filter).
 */
const CONNECT_GRID_PROVIDERS = AVAILABLE_PROVIDERS.filter(
  (p) => p.provider !== 'quickbooks' && p.provider !== 'cloudbeds',
)

/** Layout tokens — cream canvas inside HotelLayout (matches dashboard). */
const PAGE = 'mx-auto max-w-5xl px-4 py-8 pb-24 md:px-8 md:py-10 space-y-14'
const CARD = 'rounded-2xl border border-vesta-navy/10 bg-white shadow-sm'
const CARD_SUBTLE = 'rounded-2xl border border-vesta-navy/10 bg-vesta-mist/25 shadow-sm'
const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-widest text-vesta-navy-muted mb-3'
const BTN_PRIMARY =
  'rounded-xl bg-vesta-gold text-vesta-navy font-semibold hover:bg-vesta-gold/90 shadow-sm border-0'
const ICON_TILE = 'rounded-xl bg-vesta-mist/70 border border-vesta-navy/10'

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
  const location = useLocation()
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

  /** Intuit redirects here with query params; process once per return. */
  const qbOAuthReturnHandledRef = useRef(false)
  /** If OAuth completes before hotelId is loaded, finish when hotelId appears. */
  const pendingQbOAuthRef = useRef<{ code: string; realmId: string; state: string } | null>(null)

  const runQuickBooksCallback = useCallback(
    async (code: string, realmId: string, state: string) => {
      const stateHotelId = parseHotelIdFromQuickBooksState(state)
      let targetHotelId = hotelId

      if (!targetHotelId && stateHotelId) {
        targetHotelId = stateHotelId
      }

      if (!targetHotelId) {
        pendingQbOAuthRef.current = { code, realmId, state }
        toast.info('QuickBooks: connection will finish once your hotel workspace is ready.')
        return
      }

      if (hotelId && stateHotelId && hotelId !== stateHotelId) {
        toast.error(
          'This QuickBooks sign-in does not match your current hotel workspace. Connect again from Integrations.',
        )
        return
      }

      setQbCallbackLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('quickbooks-hotel-oauth', {
          body: {
            action: 'callback',
            hotel_id: targetHotelId,
            code,
            realm_id: realmId.trim() ? realmId : '',
            state,
          },
        })
        if (error) {
          toast.error('Failed to connect QuickBooks: ' + error.message)
          return
        }
        if (data && typeof data === 'object' && 'error' in data) {
          const msg =
            (data as { details?: string; error?: string }).details ??
            (data as { error?: string }).error ??
            'QuickBooks connection failed'
          toast.error(msg)
          return
        }
        toast.success('QuickBooks connected!')
        try {
          await refreshQuickBooksIntegrationQueries(queryClient, targetHotelId)
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : 'Connected, but could not refresh status — refresh the page.',
          )
        }
      } finally {
        setQbCallbackLoading(false)
      }
    },
    [hotelId, queryClient],
  )

  // Finish OAuth if it was deferred until hotelId existed
  useEffect(() => {
    if (!hotelId || !pendingQbOAuthRef.current) return
    const p = pendingQbOAuthRef.current
    pendingQbOAuthRef.current = null
    void runQuickBooksCallback(p.code, p.realmId, p.state)
  }, [hotelId, runQuickBooksCallback])

  // Same-tab flow lands on /integrations/qb-callback then navigates here with state — refresh the QB card.
  useEffect(() => {
    const s = location.state as { qbOAuthHandled?: boolean } | null
    if (!hotelId || !s?.qbOAuthHandled) return
    void refreshQuickBooksIntegrationQueries(queryClient, hotelId).catch((e) =>
      toast.error(e instanceof Error ? e.message : 'Could not refresh QuickBooks status'),
    )
    navigate(location.pathname, { replace: true, state: {} })
  }, [hotelId, location.pathname, location.state, navigate, queryClient])

  // ---------------------------------------------------------------------------
  // QuickBooks OAuth: popup return, same-tab return (popup blocked), postMessage
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const search = window.location.search
    const topParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    const intuitError = topParams.get('error')
    if (intuitError) {
      const desc = topParams.get('error_description') ?? intuitError
      toast.error(`QuickBooks: ${desc}`)
      void navigate('/integrations', { replace: true })
      return undefined
    }

    const { code, realmId, state } = parseQuickBooksOAuthCallbackParams(search)

    // Popup window: forward params to opener and close
    if (code && state && window.opener) {
      window.opener.postMessage(
        { type: 'QB_CALLBACK', code, realmId: realmId ?? '', state },
        window.location.origin,
      )
      window.close()
      return undefined
    }

    let cancelled = false

    // Same-tab return on /integrations (legacy redirect URI only): only treat as QB if it matches our flow.
    if (isHotelQuickBooksOAuthRedirect(search) && !window.opener) {
      if (code && state) {
        if (!qbOAuthReturnHandledRef.current) {
          qbOAuthReturnHandledRef.current = true
          const c = code
          const r = realmId ?? ''
          const s = state
          void (async () => {
            try {
              await runQuickBooksCallback(c, r, s)
            } finally {
              if (!cancelled) {
                navigate('/integrations', { replace: true })
                qbOAuthReturnHandledRef.current = false
              }
            }
          })()
        }
      } else {
        toast.error(
          'QuickBooks returned an unexpected URL. Use Connect again from Integrations, and in the Intuit Developer app set the Redirect URI to your site URL with path /integrations/qb-callback.',
        )
        void navigate('/integrations', { replace: true })
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'QB_CALLBACK') return
      const { code: c, realmId: r, realm_id: r2, state: s } = event.data as {
        code?: string
        realmId?: string
        realm_id?: string
        state?: string
      }
      const realm = (r ?? r2 ?? '').trim()
      if (!c || !s) {
        toast.error('QuickBooks popup returned incomplete data. Close the window and try Connect again.')
        return
      }
      if (qbOAuthReturnHandledRef.current) return
      qbOAuthReturnHandledRef.current = true
      void (async () => {
        try {
          await runQuickBooksCallback(c, realm, s)
        } finally {
          qbOAuthReturnHandledRef.current = false
        }
      })()
    }

    window.addEventListener('message', handleMessage)
    return () => {
      cancelled = true
      window.removeEventListener('message', handleMessage)
    }
  }, [navigate, runQuickBooksCallback])

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: hotelIntegrationsQueryKey(hotelId ?? '__no_hotel__'),
    queryFn: async () => {
      if (!hotelId) return []
      return fetchHotelIntegrations(hotelId)
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
    queryKey: qbIntegrationQueryKey(hotelId ?? '__no_hotel__'),
    queryFn: async () => {
      if (!hotelId) return null
      return fetchHotelQuickBooksIntegration(hotelId)
    },
    enabled: !!hotelId,
    refetchOnMount: 'always',
    staleTime: 0,
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

  const connectedProviders = useMemo(
    () => new Set(integrations.map((i) => i.provider)),
    [integrations],
  )

  /** PMS + manual only — QuickBooks is only on the dedicated card to avoid duplicate rows and sync buttons. */
  const pmsIntegrations = useMemo(
    () => integrations.filter((i) => i.provider !== 'quickbooks'),
    [integrations],
  )

  const connectGridProviders = useMemo(
    () => CONNECT_GRID_PROVIDERS.filter((p) => !connectedProviders.has(p.provider)),
    [connectedProviders],
  )

  const integrationHealth = useMemo(() => {
    const pmsAttention = pmsIntegrations.filter(
      (i) =>
        i.status === 'error' ||
        (typeof i.error_message === 'string' && i.error_message.trim().length > 0),
    )
    const qbAttention =
      !!qbIntegration &&
      (qbIntegration.status === 'error' ||
        (typeof qbIntegration.error_message === 'string' &&
          qbIntegration.error_message.trim().length > 0))
    const cutoff = subHours(new Date(), 48)
    const recentFailedSyncs = syncLogs.filter(
      (l) => l.status === 'failed' && new Date(l.started_at) >= cutoff,
    )
    return {
      pmsAttention,
      qbAttention,
      recentFailedCount: recentFailedSyncs.length,
      showBanner:
        pmsAttention.length > 0 || qbAttention || recentFailedSyncs.length > 0,
    }
  }, [pmsIntegrations, qbIntegration, syncLogs])

  // ---------------------------------------------------------------------------
  // QuickBooks handlers
  // ---------------------------------------------------------------------------

  const handleQBConnect = async () => {
    if (!hotelId) {
      toast.error('No hotel found. Complete onboarding first.')
      return
    }
    qbOAuthReturnHandledRef.current = false
    setQbConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-hotel-oauth', {
        body: { action: 'authorize', hotel_id: hotelId },
      })
      if (error) throw error
      const authUrl = data && typeof data === 'object' && 'authUrl' in data ? (data as { authUrl: string }).authUrl : ''
      if (!authUrl) {
        toast.error('Could not start QuickBooks — missing authorization URL.')
        return
      }
      const popup = window.open(authUrl, 'qb_oauth', 'width=600,height=700,left=200,top=100')
      if (!popup) {
        window.location.href = authUrl
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start QuickBooks connection'
      toast.error(msg)
    } finally {
      setQbConnecting(false)
    }
  }

  const handleQBDisconnect = async () => {
    if (!hotelId) return
    const { error } = await supabase.functions.invoke('quickbooks-hotel-oauth', {
      body: { action: 'disconnect', hotel_id: hotelId },
    })
    if (error) {
      toast.error(error.message ?? 'Could not disconnect QuickBooks')
      return
    }
    await refreshQuickBooksIntegrationQueries(queryClient, hotelId)
    toast.success('QuickBooks disconnected')
  }

  const handleQBSync = async () => {
    if (!hotelId) return
    setQbSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-hotel-sync', {
        body: { hotel_id: hotelId },
      })
      if (error) throw error
      if (data && typeof data === 'object' && 'error' in data) {
        toast.error((data as { error?: string }).error ?? 'QuickBooks sync failed')
        return
      }
      const count = (data as { synced_count?: number })?.synced_count ?? 0
      toast.success(`Synced ${count} expenses from QuickBooks`)
      await refreshQuickBooksIntegrationQueries(queryClient, hotelId)
      queryClient.invalidateQueries({ queryKey: ['sync_logs', hotelId] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'QuickBooks sync failed'
      toast.error(msg)
    } finally {
      setQbSyncing(false)
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
      queryClient.invalidateQueries({ queryKey: hotelIntegrationsQueryKey(hotelId) })
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
      queryClient.invalidateQueries({ queryKey: hotelIntegrationsQueryKey(hotelId) })
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
        queryClient.invalidateQueries({ queryKey: hotelIntegrationsQueryKey(hotelId) })
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
        await refreshQuickBooksIntegrationQueries(queryClient, hotelId)
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
    <div className={PAGE}>
      <header className="space-y-2 border-b border-vesta-navy/10 pb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-vesta-navy-muted">Hotel workspace</p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-vesta-navy md:text-4xl">Integrations</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-vesta-navy/75 md:text-base">
          Connect accounting and your PMS, manage your Vesta subscription, and import CSVs — all in one place.
        </p>
      </header>

      {hotelId && integrationHealth.showBanner ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm"
        >
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden />
            <div className="min-w-0 space-y-2">
              <p className="font-semibold text-amber-950">Something needs attention</p>
              <ul className="list-disc space-y-1 pl-4 text-amber-900/90">
                {integrationHealth.pmsAttention.length > 0 ? (
                  <li>
                    Property system
                    {integrationHealth.pmsAttention.length > 1 ? 's' : ''}:{' '}
                    {integrationHealth.pmsAttention
                      .map((i) => PROVIDER_LABELS[i.provider] ?? i.provider)
                      .join(', ')}
                  </li>
                ) : null}
                {integrationHealth.qbAttention ? <li>QuickBooks Online</li> : null}
                {integrationHealth.recentFailedCount > 0 ? (
                  <li>
                    {integrationHealth.recentFailedCount} failed sync
                    {integrationHealth.recentFailedCount === 1 ? '' : 's'} in the last 48 hours
                  </li>
                ) : null}
              </ul>
              <p>
                <a
                  href="#connected-integrations"
                  className="font-medium text-amber-950 underline underline-offset-2 hover:text-amber-800"
                >
                  Jump to connected systems
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Accounting — QuickBooks */}
      <section aria-label="QuickBooks Online" className="space-y-4">
        <h2 className={SECTION_LABEL}>Accounting</h2>
        {qbCallbackLoading ? (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-vesta-navy/10 bg-white shadow-sm">
            <RefreshCw className="h-6 w-6 animate-spin text-vesta-navy-muted" />
            <span className="ml-3 text-sm font-medium text-vesta-navy">Finishing QuickBooks connection…</span>
          </div>
        ) : (
          <Card className={`${CARD} overflow-hidden border-l-4 border-l-integrate-quickbooks`}>
            <CardContent className="p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-vesta-navy/10 bg-vesta-cream p-2">
                  <img src={quickbooksLogo} alt="" className="h-9 w-9 object-contain" width={36} height={36} />
                </div>
                <div>
                  <p className="font-semibold text-vesta-navy">QuickBooks Online</p>
                  <p className="mt-1 max-w-md text-sm text-vesta-navy/70">
                    Sync expenses and financial data into Vesta. You&apos;ll sign in with Intuit and pick a company.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex shrink-0 flex-col items-stretch gap-3 md:mt-0 md:items-end">
                {qbLoading ? (
                  <div className="h-10 w-32 animate-pulse rounded-xl bg-vesta-mist/80" />
                ) : qbIntegration ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      {qbIntegration.status === 'error' ? (
                        <Badge className="border border-red-200 bg-red-50 text-red-900 text-xs">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Needs attention
                        </Badge>
                      ) : (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                      )}
                      <span className="text-xs text-vesta-navy-muted">
                        {qbIntegration.last_sync_at
                          ? `Last sync ${formatDistanceToNow(new Date(qbIntegration.last_sync_at), { addSuffix: true })}`
                          : 'Not synced yet'}
                      </span>
                    </div>
                    {qbIntegration.error_message ? (
                      <p className="max-w-sm text-right text-xs text-red-800 md:ml-auto">{qbIntegration.error_message}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        size="sm"
                        onClick={handleQBSync}
                        disabled={qbSyncing}
                        className={`${BTN_PRIMARY} disabled:opacity-50`}
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${qbSyncing ? 'animate-spin' : ''}`} />
                        {qbSyncing ? 'Syncing…' : 'Sync now'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleQBDisconnect}
                        className="rounded-xl border-vesta-navy/15 text-vesta-navy hover:bg-red-50 hover:text-red-800 hover:border-red-200"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      size="default"
                      onClick={handleQBConnect}
                      disabled={qbConnecting || !hotelId}
                      className="h-11 rounded-xl bg-integrate-quickbooks font-semibold text-white hover:bg-integrate-quickbooks-hover disabled:opacity-50"
                    >
                      {qbConnecting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Opening Intuit…
                        </>
                      ) : (
                        <>
                          <Plug className="mr-2 h-4 w-4" />
                          Connect QuickBooks
                        </>
                      )}
                    </Button>
                    {hotelId ? null : (
                      <p className="max-w-xs text-xs text-vesta-navy-muted md:text-right">
                        Finish hotel onboarding first, then connect QuickBooks.
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Workspace services — billing (transactional email is server-side via Resend; not a user integration) */}
      <section aria-label="Billing" className="space-y-4">
        <h2 className={SECTION_LABEL}>Workspace services</h2>
        <div className="grid gap-4 md:max-w-2xl">
          <Card className={`${CARD} border-t-4 border-t-vesta-navy-muted`}>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center ${ICON_TILE}`}>
                  <CreditCard className="h-5 w-5 text-vesta-navy-muted" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-vesta-navy">Stripe billing</p>
                  <p className="mt-1 text-sm text-vesta-navy/70">
                    Payment method, invoices, and subscription for your Vesta plan.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {stripeBillingLoading ? (
                  <div className="h-9 w-40 animate-pulse rounded-lg bg-vesta-mist/80" />
                ) : stripeBillingError ? (
                  <>
                    <p className="text-sm text-red-700">Could not load subscription.</p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => refetchStripeBilling()}>
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    {stripeBilling?.subscribed && (
                      <Badge variant="outline" className="border-vesta-navy/15 bg-vesta-mist/40 text-vesta-navy text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {stripeBilling.has_stripe_subscription ? 'Stripe active' : 'Subscribed'}
                      </Badge>
                    )}
                    {stripeBilling?.subscription_tier && (
                      <span className="text-xs text-vesta-navy-muted">
                        {stripeBilling.subscription_tier}
                        {stripeBilling.subscription_end
                          ? ` · Renews ${format(new Date(stripeBilling.subscription_end), 'MMM d, yyyy')}`
                          : ''}
                      </span>
                    )}
                    <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-vesta-navy/15"
                        disabled={stripePortalLoading}
                        onClick={handleStripeCustomerPortal}
                      >
                        {stripePortalLoading ? (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Manage billing
                      </Button>
                      <Button size="sm" className={BTN_PRIMARY} onClick={() => navigate('/pricing')}>
                        View plans
                      </Button>
                    </div>
                    {!stripeBilling?.subscribed && !stripeBillingLoading && (
                      <p className="w-full text-xs text-vesta-navy-muted">
                        No active subscription yet — open View plans to subscribe.
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={mewsDialogOpen} onOpenChange={setMewsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-vesta-navy/10 bg-white p-6 text-vesta-navy shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-light">Connect Mews</DialogTitle>
            <DialogDescription className="text-vesta-navy/70">
              Defaults use Mews&apos;s published <strong className="font-medium text-vesta-navy">Gross demo</strong> and{' '}
              {MEWS_DEMO_PLATFORM_URL}. For production use <strong className="font-medium text-vesta-navy">https://api.mews.com</strong>{' '}
              and your certified tokens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl border border-vesta-gold/25 bg-vesta-gold/5 px-3 py-3">
            <p className="text-xs leading-relaxed text-vesta-navy/80">
              <span className="font-medium text-vesta-navy">Demo only:</span> no real guest or payment data.{' '}
              <a
                href={MEWS_DEMO_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-vesta-navy-muted underline underline-offset-2 hover:text-vesta-navy"
              >
                Mews environment docs
              </a>
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full rounded-xl border border-vesta-navy/10 bg-vesta-cream text-vesta-navy hover:bg-vesta-mist/50"
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
              <Label htmlFor="mews-client-token" className="text-vesta-navy">
                Client token
              </Label>
              <Input
                id="mews-client-token"
                type="password"
                autoComplete="off"
                placeholder="Client token"
                value={mewsClientToken}
                onChange={(e) => setMewsClientToken(e.target.value)}
                className="rounded-xl border-vesta-navy/15 bg-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mews-access-token" className="text-vesta-navy">
                Access token
              </Label>
              <Input
                id="mews-access-token"
                type="password"
                autoComplete="off"
                placeholder="Access token"
                value={mewsAccessToken}
                onChange={(e) => setMewsAccessToken(e.target.value)}
                className="rounded-xl border-vesta-navy/15 bg-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mews-platform-url" className="text-vesta-navy">
                Platform URL <span className="font-normal text-vesta-navy-muted">(optional)</span>
              </Label>
              <Input
                id="mews-platform-url"
                type="url"
                placeholder="https://api.mews.com"
                value={mewsPlatformUrl}
                onChange={(e) => setMewsPlatformUrl(e.target.value)}
                className="rounded-xl border-vesta-navy/15 bg-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-vesta-navy/15"
              onClick={() => setMewsDialogOpen(false)}
              disabled={mewsConnecting}
            >
              Cancel
            </Button>
            <Button type="button" className={BTN_PRIMARY} disabled={mewsConnecting} onClick={handleMewsSubmit}>
              {mewsConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                'Verify & connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connected PMS / manual */}
      <section
        id="connected-integrations"
        aria-label="Connected integrations"
        className="scroll-mt-24 space-y-4"
      >
        <div>
          <h2 className={SECTION_LABEL}>Connected property systems</h2>
          <p className="text-sm text-vesta-navy/65">Mews, manual entry, and other PMS connections. QuickBooks is under Accounting.</p>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-vesta-navy/10 bg-vesta-mist/30" />
            ))}
          </div>
        ) : pmsIntegrations.length === 0 ? (
          <Card className={CARD_SUBTLE}>
            <CardContent className="py-12 text-center">
              <WifiOff className="mx-auto mb-3 h-8 w-8 text-vesta-navy-muted" />
              <p className="font-medium text-vesta-navy">No PMS connected yet</p>
              <p className="mt-1 text-sm text-vesta-navy/70">
                Add Mews or enable manual entry below to feed daily metrics into Vesta.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pmsIntegrations.map((integration) => {
              const cfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const recentLogs = syncLogs.filter((l) => l.integration_id === integration.id).slice(0, 5)

              return (
                <Card key={integration.id} className={CARD}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center ${ICON_TILE}`}>
                          <Wifi className="h-5 w-5 text-vesta-navy-muted" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-vesta-navy">
                              {PROVIDER_LABELS[integration.provider] ?? integration.provider}
                            </span>
                            <Badge className={`text-xs border ${cfg.badge}`}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-vesta-navy/65">
                            {integration.last_sync_at
                              ? `Last synced ${formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}`
                              : 'Never synced'}
                          </p>
                          {integration.error_message && (
                            <p className="mt-1 text-xs text-red-700">{integration.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-xl border-vesta-navy/15"
                        disabled={isSyncing || pmsSyncingId === integration.id}
                        onClick={() => handleIntegrationSync(integration)}
                      >
                        <RefreshCw
                          className={`mr-1.5 h-3.5 w-3.5 ${
                            isSyncing || pmsSyncingId === integration.id ? 'animate-spin' : ''
                          }`}
                        />
                        Sync now
                      </Button>
                    </div>

                    {recentLogs.length > 0 && (
                      <div className="mt-5 border-t border-vesta-navy/10 pt-5">
                        <p className="mb-2 text-xs font-medium text-vesta-navy-muted">Recent syncs</p>
                        <div className="space-y-1.5">
                          {recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    log.status === 'success'
                                      ? 'font-medium text-emerald-700'
                                      : log.status === 'failed'
                                        ? 'font-medium text-red-700'
                                        : log.status === 'partial'
                                          ? 'font-medium text-amber-800'
                                          : 'text-vesta-navy-muted'
                                  }
                                >
                                  {log.status}
                                </span>
                                <span className="text-vesta-navy/65">{log.records_synced} records</span>
                              </div>
                              <span className="text-vesta-navy-muted">
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

      {/* Add integrations */}
      <section aria-label="Connect new integrations" className="space-y-4">
        <div>
          <h2 className={SECTION_LABEL}>Add a connection</h2>
          <p className="text-sm text-vesta-navy/65">
            Mews opens a secure token form. Manual entry unlocks the dashboard and CSV import. Other PMS options show a
            coming-soon message until live.
          </p>
        </div>
        {connectGridProviders.length === 0 ? (
          <Card className={CARD_SUBTLE}>
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
              <p className="text-sm text-vesta-navy">Every listed PMS option is already connected for this hotel.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectGridProviders.map((p) => (
              <Card
                key={p.provider}
                className={`${CARD} transition-shadow hover:shadow-md`}
              >
                <CardHeader className="p-5 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-vesta-navy">{p.label}</CardTitle>
                    <Badge variant="outline" className="shrink-0 border-vesta-navy/15 text-xs text-vesta-navy-muted">
                      {p.type === 'pms' ? 'PMS' : p.type === 'accounting' ? 'Accounting' : p.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-sm leading-relaxed text-vesta-navy/70">{p.description}</p>
                  <Button
                    size="sm"
                    className={`mt-4 w-full ${BTN_PRIMARY}`}
                    disabled={!hotelId || (p.provider === 'mews' && mewsConnecting)}
                    onClick={() => handleConnectProvider(p.provider)}
                  >
                    <Plug className="mr-1.5 h-3.5 w-3.5" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Import Data section                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section id="import-csv" aria-label="Import CSV data" className="space-y-4 scroll-mt-24">
        <div>
          <h2 className={SECTION_LABEL}>Import CSV</h2>
          <p className="text-sm text-vesta-navy/65">Bulk load daily metrics, expenses, or channel revenue when you don&apos;t have an API connection yet.</p>
        </div>

        <Card className={CARD}>
          <CardContent className="space-y-6 p-6 md:p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`
                relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 transition-colors
                ${selectedFile
                  ? 'cursor-default border-vesta-gold/50 bg-vesta-gold/10'
                  : dragActive
                    ? 'cursor-copy border-vesta-gold bg-vesta-gold/15'
                    : 'border-vesta-navy/20 bg-vesta-mist/20 hover:border-vesta-navy-muted hover:bg-vesta-mist/40'
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
                  <FileSpreadsheet className="h-8 w-8 shrink-0 text-vesta-gold" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-vesta-navy">{selectedFile.name}</p>
                    <p className="mt-0.5 text-xs text-vesta-navy-muted">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                    className="ml-2 rounded-md p-1 text-vesta-navy-muted transition-colors hover:bg-vesta-navy/5 hover:text-vesta-navy"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${ICON_TILE}`}>
                    <Upload className="h-6 w-6 text-vesta-navy-muted" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-vesta-navy">
                      Drop a CSV here, or{' '}
                      <button
                        type="button"
                        className="font-semibold text-vesta-navy-muted underline underline-offset-2 hover:text-vesta-navy"
                        onClick={(e) => {
                          e.stopPropagation()
                          fileInputRef.current?.click()
                        }}
                      >
                        browse
                      </button>
                    </p>
                    <p className="mt-1 text-xs text-vesta-navy-muted">.csv only</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-vesta-navy-muted">Data type</label>
                <Select
                  value={importType}
                  onValueChange={(val) => setImportType(val as ImportType)}
                >
                  <SelectTrigger className="rounded-xl border-vesta-navy/15 bg-white">
                    <SelectValue placeholder="Select data type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(IMPORT_TYPE_LABELS) as ImportType[]).map((type) => (
                      <SelectItem key={type} value={type}>
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
                  className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto rounded-xl`}
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

            <div className="border-t border-vesta-navy/10 pt-4">
              <p className="text-xs text-vesta-navy-muted">
                Sample files:{' '}
                {(Object.keys(SAMPLE_CSV_PATHS) as ImportType[]).map((type, idx, arr) => (
                  <span key={type}>
                    <a
                      href={SAMPLE_CSV_PATHS[type]}
                      download
                      className="font-medium text-vesta-navy-muted underline underline-offset-2 hover:text-vesta-navy"
                    >
                      {IMPORT_TYPE_LABELS[type]}
                    </a>
                    {idx < arr.length - 1 && <span className="text-vesta-navy-muted/50">{' · '}</span>}
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
