/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public app origin for auth/OAuth redirects (no trailing slash). Example: https://vesta.ai */
  readonly VITE_SITE_URL?: string;
  /**
   * Browser DSN; if unset, a project default is used. Set to "false" to disable Sentry in the browser.
   */
  readonly VITE_SENTRY_DSN?: string;
  /** If "false", disables default PII (e.g. IP). Otherwise default PII is enabled. */
  readonly VITE_SENTRY_SEND_DEFAULT_PII?: string;
  /** Optional release name (e.g. git SHA); also set via build define from VERCEL_GIT_COMMIT_SHA */
  readonly VITE_SENTRY_RELEASE?: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
  /** Stripe publishable key (pk_live_… / pk_test_…). Optional unless you use Stripe.js in the browser. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
