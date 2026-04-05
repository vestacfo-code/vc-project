import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { refreshQuickBooksIntegrationQueries } from '@/lib/hotel-integrations-queries'
import { parseQuickBooksOAuthParamsFromLocation } from '@/lib/quickbooks-oauth-params'
import { parseHotelIdFromQuickBooksState } from '@/lib/supabase-third-party-oauth'
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

  const goIntegrations = useCallback(
    (opts?: { qbOAuthHandled?: boolean }) => {
      navigate('/integrations', {
        replace: true,
        ...(opts?.qbOAuthHandled ? { state: { qbOAuthHandled: true } } : {}),
      })
    },
    [navigate],
  )

  const runCallback = useCallback(
    async (code: string, realmId: string, state: string, hotelForBody: string) => {
      if (handledRef.current) return
      handledRef.current = true
      let connected = false
      try {
        const { data, error } = await supabase.functions.invoke('quickbooks-hotel-oauth', {
          body: { action: 'callback', hotel_id: hotelForBody, code, realm_id: realmId, state },
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
          await refreshQuickBooksIntegrationQueries(queryClient, hotelForBody)
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : 'Connected, but could not refresh status — refresh the page.',
          )
        }
        connected = true
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'QuickBooks connection failed')
      } finally {
        goIntegrations(connected ? { qbOAuthHandled: true } : undefined)
      }
    },
    [goIntegrations, queryClient],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const intuitError = params.get('error')
    if (intuitError) {
      const desc = params.get('error_description') ?? intuitError
      toast.error(`QuickBooks: ${desc}`)
      goIntegrations()
      return
    }

    const { code, realmId, state } = parseQuickBooksOAuthParamsFromLocation()

    if (code && state && window.opener) {
      window.opener.postMessage(
        { type: 'QB_CALLBACK', code, realmId: realmId ?? '', state },
        window.location.origin,
      )
      window.close()
      return
    }

    if (!code || !state) {
      toast.error(
        'QuickBooks did not return authorization data (missing code or state). If you had to sign in first, try Connect QuickBooks again — the app now keeps the Intuit callback after login. Otherwise, in the Intuit Developer app add Redirect URI: your site URL plus path /integrations/qb-callback (exact match, including https).',
      )
      goIntegrations()
      return
    }

    if (dashboardLoading) return

    const stateHotelId = parseHotelIdFromQuickBooksState(state)
    if (hotelId && stateHotelId && hotelId !== stateHotelId) {
      toast.error(
        'This QuickBooks sign-in does not match your current hotel workspace. Open Integrations and connect again.',
      )
      goIntegrations()
      return
    }

    const effectiveHotelId = hotelId ?? stateHotelId
    if (!effectiveHotelId) {
      toast.error('No hotel workspace found. Finish onboarding, then connect QuickBooks from Integrations.')
      goIntegrations()
      return
    }

    void runCallback(code, realmId ?? '', state, effectiveHotelId)
  }, [dashboardLoading, goIntegrations, hotelId, runCallback])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-vesta-navy">
      <Loader2 className="h-8 w-8 animate-spin text-vesta-gold" aria-hidden />
      <p className="text-sm text-vesta-navy/80">Finishing QuickBooks connection…</p>
    </div>
  )
}
