import { supabase } from '@/integrations/supabase/client';

export function useGenerateSummary() {
  const generateSummary = async (hotelId: string) => {
    const { data, error } = await supabase.functions.invoke('generate-daily-summary', {
      body: { hotel_id: hotelId }
    });
    return { data, error };
  };
  return { generateSummary };
}
