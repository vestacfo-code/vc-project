/**
 * Occupancy metrics for hotel performance tracking.
 */

/** Occupancy rate as a decimal (0–1) */
export function calculateOccupancyRate(roomsSold: number, roomsAvailable: number): number {
  if (roomsAvailable <= 0) return 0;
  return roomsSold / roomsAvailable;
}

/** ADR — Average Daily Rate */
export function calculateADR(totalRoomRevenue: number, roomsSold: number): number {
  if (roomsSold <= 0) return 0;
  return totalRoomRevenue / roomsSold;
}

/** Format occupancy as percentage string */
export function formatOccupancy(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
