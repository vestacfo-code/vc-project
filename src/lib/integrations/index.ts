import { registerAdapter } from './registry'
import { mewsAdapter } from './adapters/mews'
import { cloudbedsAdapter } from './adapters/cloudbeds'
import { manualAdapter } from './adapters/manual'

// Register all adapters on import
registerAdapter(mewsAdapter)
registerAdapter(cloudbedsAdapter)
registerAdapter(manualAdapter)

export { syncIntegration } from './syncService'
export { getAdapter, getRegisteredProviders } from './registry'
export type { DailyMetricsPayload, RevenueByChannelPayload, IntegrationAdapter, SyncResult } from './types'
