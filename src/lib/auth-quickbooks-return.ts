import type { Location } from 'react-router-dom'
import { combineRouterSearchAndHash } from '@/lib/quickbooks-oauth-params'
import {
  isQuickBooksIntegrationCallbackPath,
  QUICKBOOKS_INTEGRATION_CALLBACK_PATH,
} from '@/lib/quickbooks-callback-path'

function hasOAuthCodeOrState(blob: string): boolean {
  return blob.includes('code=') || blob.includes('state=')
}

/**
 * After login, resume Intuit redirect: `Navigate` state from ProtectedRoute and/or
 * `vesta_oauth_return_path` in sessionStorage (set when unauthenticated user hits qb-callback).
 */
export function getPendingQuickBooksReturnTo(
  location: Location,
): Pick<Location, 'pathname' | 'search' | 'hash'> | null {
  const fromState =
    location.state && typeof location.state === 'object' && 'from' in location.state
      ? (location.state as { from?: Location }).from
      : undefined

  if (fromState?.pathname && isQuickBooksIntegrationCallbackPath(fromState.pathname)) {
    const blob = combineRouterSearchAndHash(fromState)
    if (blob && hasOAuthCodeOrState(blob)) {
      return {
        pathname: QUICKBOOKS_INTEGRATION_CALLBACK_PATH,
        search: fromState.search || '',
        hash: fromState.hash ?? '',
      }
    }
  }

  try {
    const raw =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vesta_oauth_return_path') : null
    if (raw) {
      const parsed = JSON.parse(raw) as Pick<Location, 'pathname' | 'search' | 'hash'>
      if (parsed.pathname && isQuickBooksIntegrationCallbackPath(parsed.pathname)) {
        const blob = combineRouterSearchAndHash(parsed)
        if (blob && hasOAuthCodeOrState(blob)) {
          return {
            pathname: QUICKBOOKS_INTEGRATION_CALLBACK_PATH,
            search: parsed.search || '',
            hash: parsed.hash ?? '',
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  return null
}
