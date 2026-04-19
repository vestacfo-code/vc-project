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

const SANDBOX_URL = "https://sandbox-quickbooks.api.intuit.com";
const PRODUCTION_URL = "https://quickbooks.api.intuit.com";

/** Infer sandbox vs production from the accounting API base URL. */
export function quickBooksApiEnvironmentFromBaseUrl(baseUrl: string): QuickBooksApiEnvironment {
  const u = baseUrl.replace(/\/$/, "");
  if (u.includes("sandbox-quickbooks")) return "sandbox";
  return "production";
}

/** The other QuickBooks Accounting API host (sandbox ↔ production). */
export function alternateQuickBooksAccountingApiBase(currentBase: string): string {
  const u = currentBase.replace(/\/$/, "");
  if (u === SANDBOX_URL || u.includes("sandbox-quickbooks")) return PRODUCTION_URL;
  return SANDBOX_URL;
}
