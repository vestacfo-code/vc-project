/** Default scope — Intuit "Accounting" API; avoids "Invalid param: scope" when OpenID scopes are set without Sign in with Intuit. */
export const DEFAULT_QUICKBOOKS_OAUTH_SCOPE = "com.intuit.quickbooks.accounting";

/**
 * Reads QUICKBOOKS_OAUTH_SCOPE secret (optional). Normalizes commas / quotes / whitespace.
 * If the value omits `com.intuit.quickbooks.accounting`, returns the default (ignores openid-only mistakes).
 */
export function resolveQuickBooksOAuthScope(): string {
  const raw = Deno.env.get("QUICKBOOKS_OAUTH_SCOPE");
  if (raw == null) return DEFAULT_QUICKBOOKS_OAUTH_SCOPE;
  let s = raw.trim();
  if (!s.length) return DEFAULT_QUICKBOOKS_OAUTH_SCOPE;
  s = s.replace(/,/g, " ");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  if (!s.length) return DEFAULT_QUICKBOOKS_OAUTH_SCOPE;
  if (!s.includes("com.intuit.quickbooks.accounting")) {
    return DEFAULT_QUICKBOOKS_OAUTH_SCOPE;
  }
  return s;
}
