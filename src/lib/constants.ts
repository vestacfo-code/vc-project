const trimTrailingSlash = (s: string) => s.replace(/\/$/, "");

// Canonical production origin (matches Edge defaults: SITE_URL → https://vesta.ai).
// Override per deploy with VITE_SITE_URL (e.g. preview: https://your-app.vercel.app).
const envSite = import.meta.env.VITE_SITE_URL?.trim();
export const PRODUCTION_DOMAIN = trimTrailingSlash(
  envSite && envSite.length > 0 ? envSite : "https://vesta.ai",
);

/**
 * Get the appropriate URL for redirects
 * In production, always uses the production domain
 * For local development/preview, you can pass useCurrentOrigin=true to use window.location.origin
 */
export const getRedirectUrl = (path: string, useCurrentOrigin = false): string => {
  if (useCurrentOrigin && typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return `${PRODUCTION_DOMAIN}${path}`;
};
