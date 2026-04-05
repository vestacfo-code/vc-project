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

/** Hotel QuickBooks (quickbooks-hotel-oauth): state = `${hotel_id}:${crypto.randomUUID()}`. */
const HOTEL_QB_STATE = new RegExp(`^${UUID}:${UUID}$`, 'i');

/** Legacy shape documented in older code paths. */
const LEGACY_QB_STATE_PREFIX = new RegExp(`^${UUID}:${UUID}:`, 'i');

export function isQuickBooksOAuthReturnInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('realmId') || params.has('realm_id')) return true;

  const state = params.get('state');
  const code = params.get('code');
  if (!code || !state) return false;

  if (HOTEL_QB_STATE.test(state)) return true;
  if (LEGACY_QB_STATE_PREFIX.test(state)) return true;

  const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  if (path.endsWith('/integrations/qb-callback')) return true;
  // Legacy Intuit redirect URI
  if (path.endsWith('/integrations')) return true;

  return false;
}
