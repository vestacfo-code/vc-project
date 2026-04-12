import { parseHotelIdFromQuickBooksState } from '@/lib/supabase-third-party-oauth'

export {
  QUICKBOOKS_INTEGRATION_CALLBACK_PATH,
  isQuickBooksIntegrationCallbackPath,
} from '@/lib/quickbooks-callback-path'

/**
 * Intuit usually redirects with ?code=&state=&realmId= (sometimes realm_id / realmid).
 * Normalize so we do not fail on harmless casing/alias differences.
 */
/** Merge `?query` and `#hash` fragments (some environments put params in the hash). */
export function getQuickBooksOAuthRawQueryString(): string {
  if (typeof window === 'undefined') return ''
  const search = window.location.search.replace(/^\?/, '')
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  return [search, hash].filter(Boolean).join('&')
}

/** Merge React Router `location.search` + `location.hash` the same way as the browser URL. */
export function combineRouterSearchAndHash(loc: { search?: string; hash?: string }): string {
  const search = (loc.search ?? '').replace(/^\?/, '')
  const h = loc.hash ?? ''
  const hash = h.startsWith('#') ? h.slice(1) : h.replace(/^#/, '')
  return [search, hash].filter(Boolean).join('&')
}

/**
 * Parse OAuth params from optional React Router `location` merged with `window.location`.
 * Merging avoids stale RR state after `history.replaceState` and covers Intuit params in search or hash.
 */
export function parseQuickBooksOAuthParamsFromLocation(
  loc?: { search?: string; hash?: string } | null,
): {
  code: string | null
  realmId: string | null
  state: string | null
} {
  const routerRaw = loc ? combineRouterSearchAndHash(loc) : ''
  const windowRaw = getQuickBooksOAuthRawQueryString()
  const merged = [routerRaw, windowRaw].filter(Boolean).join('&')
  return parseQuickBooksOAuthCallbackParams(merged ? `?${merged}` : '')
}

export function parseQuickBooksOAuthCallbackParams(search: string): {
  code: string | null
  realmId: string | null
  state: string | null
} {
  const normalized = search.startsWith('?') ? search.slice(1) : search.replace(/^\?/, '')
  const params = new URLSearchParams(normalized)

  const nonEmpty = (s: string | null): string | null => {
    if (s == null) return null
    const t = s.trim()
    return t.length ? t : null
  }

  const code = nonEmpty(params.get('code') ?? params.get('auth_code'))
  const realmId = nonEmpty(
    params.get('realmId') ??
      params.get('realm_id') ??
      params.get('realmid') ??
      params.get('RealmId') ??
      params.get('realm'),
  )
  const state = nonEmpty(params.get('state'))

  return { code, realmId, state }
}

/**
 * True when this URL is probably our hotel QuickBooks OAuth return (not random ?code= noise).
 */
export function isHotelQuickBooksOAuthRedirect(search: string): boolean {
  const p = parseQuickBooksOAuthCallbackParams(search)
  if (p.code && p.state && p.realmId) return true
  if (p.code && p.state && parseHotelIdFromQuickBooksState(p.state)) return true
  return false
}
