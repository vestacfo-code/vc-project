import type { QueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

export type IntegrationRow = Database['public']['Tables']['integrations']['Row']

export const qbIntegrationQueryKey = (hotelId: string) => ['qb_integration', hotelId] as const

export const hotelIntegrationsQueryKey = (hotelId: string) => ['integrations', hotelId] as const

/** Single QuickBooks row for a hotel (Integrations page card). */
export async function fetchHotelQuickBooksIntegration(
  hotelId: string,
): Promise<IntegrationRow | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('provider', 'quickbooks')
    .maybeSingle()
  if (error) throw error
  return data
}

/** All integration rows for a hotel. */
export async function fetchHotelIntegrations(hotelId: string): Promise<IntegrationRow[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * After OAuth writes tokens server-side, refresh React Query cache so the UI shows Connected
 * without relying on invalidate timing or inactive observers.
 */
export async function refreshQuickBooksIntegrationQueries(
  queryClient: QueryClient,
  hotelId: string,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: qbIntegrationQueryKey(hotelId) })
  await queryClient.invalidateQueries({ queryKey: hotelIntegrationsQueryKey(hotelId) })
  await queryClient.fetchQuery({
    queryKey: qbIntegrationQueryKey(hotelId),
    queryFn: () => fetchHotelQuickBooksIntegration(hotelId),
  })
  await queryClient.fetchQuery({
    queryKey: hotelIntegrationsQueryKey(hotelId),
    queryFn: () => fetchHotelIntegrations(hotelId),
  })
}
