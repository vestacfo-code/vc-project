/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public app origin for auth/OAuth redirects (no trailing slash). Example: https://vesta.ai */
  readonly VITE_SITE_URL?: string;
  /** Browser SDK DSN from Sentry project settings */
  readonly VITE_SENTRY_DSN?: string;
  /** Optional release name (e.g. git SHA); also set via build define from VERCEL_GIT_COMMIT_SHA */
  readonly VITE_SENTRY_RELEASE?: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
