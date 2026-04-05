/**
 * Mews Connector API — published demo environment (Gross pricing).
 * Safe for local/integration testing only; never use for real guest or financial data.
 *
 * @see https://docs.mews.com/connector-api/guidelines/environments
 */
export const MEWS_DEMO_DOCS_URL =
  'https://docs.mews.com/connector-api/guidelines/environments'

export const MEWS_DEMO_PLATFORM_URL = 'https://api.mews-demo.com'

/** Integration name in Mews docs: "Are you ready to integrate with Mews?" (Gross) */
export const MEWS_DEMO_GROSS_TOKENS = {
  clientToken:
    'E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D',
  accessToken:
    'C66EF7B239D24632943D115EDE9CB810-EA00F8FD8294692C940F6B5A8F9453D',
} as const
