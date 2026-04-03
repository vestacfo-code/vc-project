import { IntegrationAdapter } from '../types'

// Manual entry adapter — data is entered directly by the user via the dashboard.
// No API calls needed; sync is a no-op.
export const manualAdapter: IntegrationAdapter = {
  provider: 'manual',
  type: 'pms',

  async testConnection(_credentials) {
    return { success: true }
  },

  async fetchDailyMetrics(_credentials, _hotelId, _fromDate, _toDate) {
    // Data is entered manually — nothing to sync
    return []
  },
}
