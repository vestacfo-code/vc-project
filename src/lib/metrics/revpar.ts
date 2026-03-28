/**
 * RevPAR — Revenue Per Available Room
 * The primary KPI for hotel financial performance.
 *
 * RevPAR = Total Room Revenue / Total Rooms Available
 *       OR ADR × Occupancy Rate
 */

export function calculateRevPAR(
  totalRoomRevenue: number,
  totalRoomsAvailable: number
): number {
  if (totalRoomsAvailable <= 0) return 0;
  return totalRoomRevenue / totalRoomsAvailable;
}

export function calculateRevPARFromADR(
  adr: number,
  occupancyRate: number // 0–1
): number {
  return adr * occupancyRate;
}

/** RevPAR change % vs prior period */
export function revPARGrowth(current: number, prior: number): number {
  if (prior === 0) return 0;
  return ((current - prior) / prior) * 100;
}
