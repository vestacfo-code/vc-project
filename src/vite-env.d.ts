/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public app origin for auth/OAuth redirects (no trailing slash). Example: https://vesta.ai */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
