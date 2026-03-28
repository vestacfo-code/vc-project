// The normalized shape every PMS/accounting integration must produce
export interface DailyMetricsPayload {
  hotel_id: string
  date: string // YYYY-MM-DD
  rooms_available: number
  rooms_sold: number
  rooms_out_of_order?: number
  adr: number
  revpar: number
  total_revenue: number
  room_revenue: number
  fnb_revenue?: number
  spa_revenue?: number
  other_revenue?: number
  labor_cost?: number
  labor_cost_ratio?: number
  total_expenses?: number
  gop?: number
  goppar?: number
  gop_margin?: number
  data_source: 'pms_sync' | 'manual' | 'estimated'
}

export interface RevenueByChannelPayload {
  hotel_id: string
  date: string
  channel: 'direct' | 'booking_com' | 'expedia' | 'airbnb' | 'corporate' | 'walk_in' | 'gds' | 'other'
  revenue: number
  bookings_count?: number
  room_nights?: number
  commission_amount?: number
  commission_rate?: number
}

export interface IntegrationAdapter {
  provider: string // e.g. 'mews', 'cloudbeds'
  type: 'pms' | 'ota' | 'payroll' | 'pos' | 'accounting' | 'banking'

  // Test if the stored credentials are still valid
  testConnection(credentials: Record<string, string>): Promise<{ success: boolean; error?: string }>

  // Pull data for a date range and return normalized payloads
  fetchDailyMetrics(
    credentials: Record<string, string>,
    hotelId: string,
    fromDate: string,
    toDate: string
  ): Promise<DailyMetricsPayload[]>

  fetchRevenueByChannel?(
    credentials: Record<string, string>,
    hotelId: string,
    fromDate: string,
    toDate: string
  ): Promise<RevenueByChannelPayload[]>
}

export interface SyncResult {
  success: boolean
  recordsSynced: number
  recordsFailed: number
  errors: string[]
  fromDate: string
  toDate: string
}
