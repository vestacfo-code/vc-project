// Production domain for all external links and redirects
// This ensures emails, OAuth, and other redirects work correctly when published
export const PRODUCTION_DOMAIN = "https://vesta.ai";

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
