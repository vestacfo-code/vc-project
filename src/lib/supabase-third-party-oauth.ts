import { isQuickBooksIntegrationCallbackPath } from '@/lib/quickbooks-callback-path'

/**
 * Intuit QuickBooks OAuth redirects with ?code=&state=&realmId= on the callback URL.
 * Supabase Auth also uses ?code=&state= for PKCE. If detectSessionInUrl is on, Supabase
 * tries to exchange Intuit's code, fails, and clears the session — user lands on /auth.
 *
 * Detect QuickBooks returns via:
 * - realmId / realm_id (Intuit)
 * - State from quickbooks-hotel-oauth: `<hotel_uuid>:<random_uuid>` (no trailing colon)
 * - Legacy state: `<uuid>:<uuid>:<origin...>` (older QB flows)
 * - Path `/integrations/qb-callback` (preferred Intuit redirect)
 * - Legacy: `code` + `state` on `/integrations` only
 */
const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const UUID_ONLY = new RegExp(`^${UUID}$`, 'i');

/**
 * OAuth `state` from quickbooks-hotel-oauth is `${hotel_id}:${random_uuid}`.
 * Use when the dashboard hook has not resolved `hotelId` yet so the callback can still exchange the code.
 */
export function parseHotelIdFromQuickBooksState(state: string | null | undefined): string | null {
  if (!state) return null
  const prefix = state.split(':')[0] ?? ''
  return UUID_ONLY.test(prefix) ? prefix : null
}

/** Hotel QuickBooks (quickbooks-hotel-oauth): state = `${hotel_id}:${crypto.randomUUID()}`. */
const HOTEL_QB_STATE = new RegExp(`^${UUID}:${UUID}$`, 'i');

/** Legacy shape documented in older code paths. */
const LEGACY_QB_STATE_PREFIX = new RegExp(`^${UUID}:${UUID}:`, 'i');

export function isQuickBooksOAuthReturnInUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const path = window.location.pathname || '/';

  // Dedicated Intuit redirect — Supabase must never run PKCE on this path, even if query
  // params are missing, renamed, or error-only (otherwise GoTrue can wipe the session).
  if (isQuickBooksIntegrationCallbackPath(path)) {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.has('realmId') || params.has('realm_id')) return true;

  const state = params.get('state');
  const code = params.get('code');
  if (!code || !state) return false;

  if (HOTEL_QB_STATE.test(state)) return true;
  if (LEGACY_QB_STATE_PREFIX.test(state)) return true;

  // Legacy Intuit redirect URI (still allow /integrations?code=&state=)
  if (path.endsWith('/integrations')) return true;

  return false;
}
