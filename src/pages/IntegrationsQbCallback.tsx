import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { refreshQuickBooksIntegrationQueries } from '@/lib/hotel-integrations-queries'
import {
  parseQuickBooksOAuthParamsFromLocation,
  parseQuickBooksOAuthCallbackParams,
} from '@/lib/quickbooks-oauth-params'
import { getPendingQuickBooksReturnTo } from '@/lib/auth-quickbooks-return'
import { parseHotelIdFromQuickBooksState } from '@/lib/supabase-third-party-oauth'
import { useHotelDashboard } from '@/hooks/useHotelDashboard'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stitchTonalCard } from '@/components/layout/StitchRefinedPageLayout'

/**
 * Intuit redirects here (not /integrations) so Supabase Auth never sees ?code=&state= on the main integrations URL.
 * Popup: postMessage to opener and close. Same-tab: exchange code then replace to /integrations.
 */
export default function IntegrationsQbCallback() {
  const navigate = useNavigate()
  const location = useLocation()
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

    let { code, realmId, state } = parseQuickBooksOAuthParamsFromLocation()

    if (!code || !state) {
      const stored = getPendingQuickBooksReturnTo(location)
      if (stored?.search) {
        const p = parseQuickBooksOAuthCallbackParams(stored.search)
        if (p.code && p.state) {
          code = p.code
          realmId = p.realmId
          state = p.state
          try {
            sessionStorage.removeItem('vesta_oauth_return_path')
          } catch {
            /* ignore */
          }
          try {
            window.history.replaceState(null, '', `${stored.pathname}${stored.search}${stored.hash ?? ''}`)
          } catch {
            /* ignore */
          }
        }
      }
    }

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
  }, [dashboardLoading, goIntegrations, hotelId, location, runCallback])

  return (
    <div className="flex min-h-[48vh] flex-col items-center justify-center px-4 py-10 font-stitch-body">
      <div className={cn(stitchTonalCard, 'flex max-w-sm flex-col items-center gap-4 px-8 py-10 text-center')}>
        <Loader2 className="h-9 w-9 animate-spin text-vesta-gold" aria-hidden />
        <p className="text-sm font-medium text-vesta-navy">Finishing QuickBooks connection…</p>
      </div>
    </div>
  )
}
