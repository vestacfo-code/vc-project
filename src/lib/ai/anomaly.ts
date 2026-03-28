/**
 * Anomaly detection logic.
 * Compares current metrics against rolling averages to surface unusual patterns.
 * Phase 8 will implement full ML-based detection.
 */

import type { DailyMetrics } from '@/types/hotel';

export interface Anomaly {
  id: string;
  hotelId: string;
  date: string;
  metric: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  value: number;
  expectedRange: [number, number];
  detectedAt: Date;
}

export function detectOccupancyAnomaly(
  current: DailyMetrics,
  rollingAvg: number,
  threshold = 0.15
): Anomaly | null {
  const deviation = Math.abs(current.occupancyRate - rollingAvg) / rollingAvg;
  if (deviation < threshold) return null;
  return {
    id: crypto.randomUUID(),
    hotelId: current.hotelId,
    date: current.date,
    metric: 'occupancy_rate',
    severity: deviation > 0.3 ? 'critical' : 'warning',
    description: `Occupancy ${(current.occupancyRate * 100).toFixed(1)}% vs ${(rollingAvg * 100).toFixed(1)}% 30-day avg`,
    value: current.occupancyRate,
    expectedRange: [rollingAvg * (1 - threshold), rollingAvg * (1 + threshold)],
    detectedAt: new Date(),
  };
}

// TODO (Phase 8): detectLaborCostAnomaly, detectRevenueAnomaly, detectADRAnomaly
