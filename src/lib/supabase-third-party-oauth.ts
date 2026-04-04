/**
 * Intuit QuickBooks OAuth redirects with ?code=&state=&realmId= on the callback URL.
 * Supabase Auth also uses ?code=&state= for PKCE. If detectSessionInUrl is on, Supabase
 * tries to exchange Intuit's code, fails, and clears the session — user lands on /auth.
 *
 * Detect QuickBooks returns via realmId, or via our edge-function state shape:
 * `<userUuid>:<nonce>:<encodeURIComponent(appOrigin)>`
 */
export function isQuickBooksOAuthReturnInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('realmId')) return true;
  const state = params.get('state');
  const code = params.get('code');
  if (!code || !state) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:/i.test(
    state
  );
}
