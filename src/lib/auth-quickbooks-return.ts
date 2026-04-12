import type { Location } from 'react-router-dom'

export function hasQuickBooksOAuthParamsInSearch(search: string): boolean {
  return search.includes('code=') || search.includes('state=')
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

  if (
    fromState?.pathname === '/integrations/qb-callback' &&
    fromState.search &&
    hasQuickBooksOAuthParamsInSearch(fromState.search)
  ) {
    return {
      pathname: fromState.pathname,
      search: fromState.search,
      hash: fromState.hash ?? '',
    }
  }

  try {
    const raw =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vesta_oauth_return_path') : null
    if (raw) {
      const parsed = JSON.parse(raw) as Pick<Location, 'pathname' | 'search' | 'hash'>
      if (
        parsed.pathname === '/integrations/qb-callback' &&
        parsed.search &&
        hasQuickBooksOAuthParamsInSearch(parsed.search)
      ) {
        return {
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash ?? '',
        }
      }
    }
  } catch {
    /* ignore */
  }

  return null
}
