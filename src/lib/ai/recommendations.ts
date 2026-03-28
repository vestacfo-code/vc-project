/**
 * Cost-cutting and revenue recommendations engine.
 * Phase 9/10 will implement full recommendation pipeline with partner marketplace.
 */

export interface Recommendation {
  id: string;
  hotelId: string;
  category: 'labor' | 'energy' | 'supplies' | 'distribution' | 'revenue';
  title: string;
  description: string;
  estimatedSavingsMonthly: number;
  effort: 'low' | 'medium' | 'high';
  partnerSlug?: string; // links to partner marketplace
  createdAt: Date;
}

// TODO (Phase 9): generateCostRecommendations(hotelId) → Recommendation[]
// TODO (Phase 10): linkPartnerRecommendations(recommendation) → Recommendation
