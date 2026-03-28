/**
 * Core domain types for the Vesta hotel CFO platform.
 */

export type PropertyType = 'independent' | 'boutique' | 'chain' | 'resort' | 'extended_stay';
export type UserRole = 'owner' | 'admin' | 'manager' | 'viewer';
export type PlanTier = 'starter' | 'growth' | 'enterprise';
export type IntegrationProvider =
  | 'mews' | 'cloudbeds' | 'opera' | 'protel'        // PMS
  | 'booking_com' | 'expedia' | 'airbnb'              // OTA
  | 'quickbooks' | 'xero' | 'wave' | 'zoho'           // Accounting
  | 'gusto' | 'adp' | 'paychex'                       // Payroll
  | 'toast' | 'square'                                // POS
  | 'plaid';                                          // Banking

export type IntegrationType = 'pms' | 'ota' | 'payroll' | 'pos' | 'accounting' | 'banking';
export type IntegrationStatus = 'active' | 'disconnected' | 'error' | 'pending';

export interface Organization {
  id: string;
  name: string;
  ownerUserId: string;
  plan: PlanTier;
  createdAt: string;
}

export interface Hotel {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  roomCount: number;
  starRating?: number;
  propertyType: PropertyType;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelMember {
  id: string;
  userId: string;
  hotelId: string;
  role: UserRole;
}

export interface Integration {
  id: string;
  hotelId: string;
  type: IntegrationType;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncAt?: string;
  createdAt: string;
}

export interface DailyMetrics {
  id: string;
  hotelId: string;
  date: string;                // ISO date YYYY-MM-DD
  roomsAvailable: number;
  roomsSold: number;
  occupancyRate: number;       // 0–1
  adr: number;                 // Average Daily Rate
  revpar: number;              // Revenue Per Available Room
  totalRevenue: number;
  roomRevenue: number;
  fnbRevenue: number;
  otherRevenue: number;
  laborCost: number;
  laborCostRatio: number;      // 0–1
  totalExpenses: number;
  gop: number;                 // Gross Operating Profit
  goppar: number;              // GOP Per Available Room
}

export interface RevenueByChannel {
  id: string;
  hotelId: string;
  date: string;
  channel: 'direct' | 'booking_com' | 'expedia' | 'airbnb' | 'corporate' | 'walk_in' | 'other';
  revenue: number;
  bookingsCount: number;
  commissionAmount: number;
  commissionRate: number;
  netRevenue: number;
}
