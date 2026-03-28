import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { useSyncIntegration } from '@/hooks/useSyncIntegration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plug, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

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

export default function Integrations() {
  const { hotelId } = useHotelDashboard()
  const { sync, isSyncing } = useSyncIntegration()

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

  const connectedProviders = new Set(integrations.map((i) => i.provider))

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Integrations</h1>
        <p className="text-slate-400 mt-1">Connect your PMS and accounting systems to sync data automatically.</p>
      </div>

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
    </div>
  )
}
