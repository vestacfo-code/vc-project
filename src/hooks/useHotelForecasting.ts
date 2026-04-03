import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ForecastPoint {
  date: string;
  revpar: number;
  occupancy_rate: number;
  total_revenue: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface HistoricalPoint {
  date: string;
  revpar: number;
  occupancy_rate: number;
  total_revenue: number;
}

export interface ForecastResult {
  historical: HistoricalPoint[];
  projections: ForecastPoint[];
  trend: {
    revpar_slope: number;
    occupancy_slope: number;
    revenue_slope: number;
  };
  horizon_days: number;
}

export function useHotelForecasting(hotelId: string | null, horizonDays: 30 | 60 | 90 = 90) {
  const queryClient = useQueryClient();
  const queryKey = ['hotel_forecast', hotelId, horizonDays];

  const { data: forecast, isLoading, error } = useQuery<ForecastResult>({
    queryKey,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotel-forecasting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hotel_id: hotelId, horizon_days: horizonDays }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      return res.json() as Promise<ForecastResult>;
    },
    enabled: !!hotelId,
    staleTime: 1000 * 60 * 60, // cache for 1 hour — forecasts don't change often
  });

  const refresh = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    forecast,
    isLoading,
    error: error as Error | null,
    refresh: () => refresh.mutate(),
  };
}
