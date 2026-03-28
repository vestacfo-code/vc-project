import type { DailyMetrics, Hotel } from '@/types/hotel';

/**
 * Generates the system + user prompt for the daily AI briefing.
 * Phase 7 will implement the actual LLM call.
 */
export function buildDailyBriefingPrompt(hotel: Hotel, metrics: DailyMetrics): string {
  return `You are Vesta, an AI CFO for ${hotel.name}, a ${hotel.roomCount}-room hotel.

Today's date: ${metrics.date}

Key metrics:
- Occupancy: ${(metrics.occupancyRate * 100).toFixed(1)}%
- ADR: $${metrics.adr.toFixed(2)}
- RevPAR: $${metrics.revpar.toFixed(2)}
- Total Revenue: $${metrics.totalRevenue.toFixed(2)}
- Labor Cost: $${metrics.laborCost.toFixed(2)} (${(metrics.laborCostRatio * 100).toFixed(1)}% of revenue)
- GOP: $${metrics.gop.toFixed(2)}

Write a concise, plain-English daily briefing for the hotel owner (2–3 sentences).
Flag any anomalies. Tone: clear, direct, no jargon.`;
}
