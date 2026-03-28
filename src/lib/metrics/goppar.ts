/**
 * GOPPAR — Gross Operating Profit Per Available Room
 * Measures profitability after operating expenses.
 *
 * GOPPAR = GOP / Total Rooms Available
 * GOP = Total Revenue − Total Operating Expenses
 */

export function calculateGOP(totalRevenue: number, totalOperatingExpenses: number): number {
  return totalRevenue - totalOperatingExpenses;
}

export function calculateGOPPAR(gop: number, totalRoomsAvailable: number): number {
  if (totalRoomsAvailable <= 0) return 0;
  return gop / totalRoomsAvailable;
}

export function calculateGOPMargin(gop: number, totalRevenue: number): number {
  if (totalRevenue === 0) return 0;
  return (gop / totalRevenue) * 100;
}
