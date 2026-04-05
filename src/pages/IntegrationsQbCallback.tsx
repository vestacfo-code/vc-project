import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

/**
 * Intuit redirects here (not /integrations) so Supabase Auth never sees ?code=&state= on the main integrations URL.
 * Popup: postMessage to opener and close. Same-tab: exchange code then replace to /integrations.
 */
export default function IntegrationsQbCallback() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hotelId, loading: dashboardLoading } = useHotelDashboard()
  const handledRef = useRef(false)

  const runCallback = useCallback(
    async (code: string, realmId: string, state: string) => {
      if (!hotelId || handledRef.current) return
      handledRef.current = true
      try {
        const { data, error } = await supabase.functions.invoke('quickbooks-hotel-oauth', {
          body: { action: 'callback', hotel_id: hotelId, code, realm_id: realmId, state },
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
        queryClient.invalidateQueries({ queryKey: ['qb_integration', hotelId] })
        queryClient.invalidateQueries({ queryKey: ['integrations', hotelId] })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'QuickBooks connection failed')
      } finally {
        navigate('/integrations', { replace: true })
      }
    },
    [hotelId, navigate, queryClient],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const realmId = params.get('realmId') ?? params.get('realm_id')
    const state = params.get('state')

    if (code && realmId && state && window.opener) {
      window.opener.postMessage({ type: 'QB_CALLBACK', code, realmId, state }, window.location.origin)
      window.close()
      return
    }

    if (!code || !realmId || !state) {
      navigate('/integrations', { replace: true })
      return
    }

    if (dashboardLoading) return

    if (!hotelId) {
      toast.error('No hotel workspace found. Finish onboarding, then connect QuickBooks from Integrations.')
      navigate('/integrations', { replace: true })
      return
    }

    void runCallback(code, realmId, state)
  }, [dashboardLoading, hotelId, navigate, runCallback])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-vesta-navy">
      <Loader2 className="h-8 w-8 animate-spin text-vesta-gold" aria-hidden />
      <p className="text-sm text-vesta-navy/80">Finishing QuickBooks connection…</p>
    </div>
  )
}
