/**
 * Daily/weekly AI summary generation.
 * Phase 7 will implement the full LLM pipeline.
 */

export interface AISummary {
  hotelId: string;
  date: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  headline: string;
  body: string;
  status: 'on_track' | 'attention_needed' | 'critical';
  generatedAt: Date;
}

// TODO (Phase 7): implement generateDailySummary(hotelId, date) → AISummary
// TODO (Phase 7): implement generateWeeklySummary(hotelId, weekOf) → AISummary
