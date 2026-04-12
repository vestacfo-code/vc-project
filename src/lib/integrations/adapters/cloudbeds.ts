import { IntegrationAdapter } from '../types'

// Phase 6 will implement the real Cloudbeds API calls.
// Cloudbeds docs: https://hotels.cloudbeds.com/api/v1.2
export const cloudbedsAdapter: IntegrationAdapter = {
  provider: 'cloudbeds',
  type: 'pms',

  async testConnection(credentials) {
    if (!credentials.apiKey) {
      return { success: false, error: 'Missing apiKey' }
    }
    // TODO Phase 6: GET https://api.cloudbeds.com/api/v1.2/getHotelDetails
    return { success: true }
  },

  async fetchDailyMetrics(_credentials, _hotelId, _fromDate, _toDate) {
    // TODO Phase 6: GET /api/v1.2/getDailyReport
    throw new Error('Cloudbeds daily metrics sync is not yet available. Use CSV import instead.')
  },

  async fetchRevenueByChannel(_credentials, _hotelId, _fromDate, _toDate) {
    // TODO Phase 6: GET /api/v1.2/getRevenue with channel breakdown
    throw new Error('Cloudbeds revenue-by-channel sync is not yet available. Use CSV import instead.')
  },
}
