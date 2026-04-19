/**
 * QuickBooks Accounting API host must match the Intuit app mode (sandbox vs production).
 * OAuth endpoints are shared; data API uses sandbox-quickbooks.api.intuit.com for dev/sandbox companies.
 */

function envTrim(key: string): string | undefined {
  const v = Deno.env.get(key);
  if (v == null) return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

/** True when Edge secrets indicate sandbox / development QBO companies. */
export function isQuickBooksAccountingSandbox(): boolean {
  const flag = (envTrim("QUICKBOOKS_USE_SANDBOX") ?? "").toLowerCase();
  const env = (envTrim("QUICKBOOKS_ENVIRONMENT") ?? "").toLowerCase();
  return flag === "true" || flag === "1" || env === "sandbox" || env === "development";
}

export type QuickBooksApiEnvironment = "sandbox" | "production";

export function quickBooksApiEnvironmentFromSecrets(): QuickBooksApiEnvironment {
  return isQuickBooksAccountingSandbox() ? "sandbox" : "production";
}

export function quickBooksAccountingApiBaseForEnvironment(
  env: QuickBooksApiEnvironment,
): string {
  return env === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

/** Resolve API base from stored credential (preferred) or current Edge env. */
export function resolveQuickBooksAccountingApiBase(
  stored?: QuickBooksApiEnvironment | string | null,
): string {
  if (stored === "sandbox" || stored === "production") {
    return quickBooksAccountingApiBaseForEnvironment(stored);
  }
  return quickBooksAccountingApiBaseForEnvironment(quickBooksApiEnvironmentFromSecrets());
}
