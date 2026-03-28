import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Hotel {
  id: string;
  name: string;
  room_count: number | null;
  city: string | null;
  pms_provider: string | null;
  currency: string | null;
}

interface UseHotelDashboardResult {
  hotelId: string | null;
  hotel: Hotel | null;
  loading: boolean;
  error: Error | null;
}

export function useHotelDashboard(): UseHotelDashboardResult {
  const { user } = useAuth();

  // Step 1: get hotel_id from hotel_members
  const {
    data: memberRow,
    isLoading: memberLoading,
    error: memberError,
  } = useQuery({
    queryKey: ['hotel_member', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_members')
        .select('hotel_id')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { hotel_id: string } | null;
    },
    enabled: !!user,
  });

  const hotelId = memberRow?.hotel_id ?? null;

  // Step 2: fetch hotel details
  const {
    data: hotel,
    isLoading: hotelLoading,
    error: hotelError,
  } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, room_count, city, pms_provider, currency')
        .eq('id', hotelId!)
        .maybeSingle();
      if (error) throw error;
      return data as Hotel | null;
    },
    enabled: !!hotelId,
  });

  const loading = memberLoading || (!!hotelId && hotelLoading);
  const error = (memberError ?? hotelError) as Error | null;

  return { hotelId, hotel, loading, error };
}
