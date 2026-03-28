/**
 * Abstract base interface for all data source integrations.
 * Each PMS/OTA/payroll adapter implements this contract.
 */

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt: Date;
}

export interface IntegrationCredentials {
  [key: string]: string | undefined;
}

export abstract class BaseIntegration {
  abstract readonly provider: string;
  abstract readonly type: 'pms' | 'ota' | 'payroll' | 'pos' | 'accounting' | 'banking';

  abstract connect(credentials: IntegrationCredentials): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract sync(hotelId: string, from: Date, to: Date): Promise<SyncResult>;
  abstract testConnection(): Promise<boolean>;
}
