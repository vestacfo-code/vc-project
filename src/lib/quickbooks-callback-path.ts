/** Intuit redirect path (no trailing slash). */
export const QUICKBOOKS_INTEGRATION_CALLBACK_PATH = '/integrations/qb-callback'

export function isQuickBooksIntegrationCallbackPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === QUICKBOOKS_INTEGRATION_CALLBACK_PATH
}
