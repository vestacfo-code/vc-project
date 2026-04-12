import { IntegrationAdapter } from '../types'

// Phase 6 will implement the real Mews REST API calls.
// Mews docs: https://mews-systems.gitbook.io/connector-api
export const mewsAdapter: IntegrationAdapter = {
  provider: 'mews',
  type: 'pms',

  async testConnection(credentials) {
    if (!credentials.accessToken || !credentials.clientToken) {
      return { success: false, error: 'Missing accessToken or clientToken' }
    }
    // TODO Phase 6: POST https://api.mews.com/api/connector/v1/configuration/get
    return { success: true }
  },

  async fetchDailyMetrics(_credentials, _hotelId, _fromDate, _toDate) {
    // TODO Phase 6: implement real Mews API call
    // POST /api/connector/v1/reservations/getAll for occupancy + revenue
    throw new Error('Mews daily metrics sync is not yet available. Use the server-side mews-sync edge function or CSV import instead.')
  },

  async fetchRevenueByChannel(_credentials, _hotelId, _fromDate, _toDate) {
    // TODO Phase 6: POST /api/connector/v1/orders/getRevenue broken down by source
    throw new Error('Mews revenue-by-channel sync is not yet available. Use the server-side mews-sync edge function or CSV import instead.')
  },
}
