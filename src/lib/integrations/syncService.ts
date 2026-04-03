import { supabase } from '@/integrations/supabase/client'
import { getAdapter } from './registry'
import { DailyMetricsPayload, RevenueByChannelPayload, SyncResult } from './types'

export async function syncIntegration(
  integrationId: string,
  hotelId: string,
  provider: string,
  credentials: Record<string, string>,
  fromDate: string,
  toDate: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    recordsSynced: 0,
    recordsFailed: 0,
    errors: [],
    fromDate,
    toDate,
  }

  // Create sync_log entry with status 'running'
  const { data: logRow, error: logError } = await supabase
    .from('sync_logs')
    .insert({ integration_id: integrationId, hotel_id: hotelId, status: 'running' })
    .select('id')
    .single()

  if (logError || !logRow) {
    result.errors.push(`Failed to create sync log: ${logError?.message}`)
    return result
  }

  const logId = logRow.id

  try {
    const adapter = getAdapter(provider)
    if (!adapter) throw new Error(`No adapter registered for provider: ${provider}`)

    // Test connection first
    const { success: connected, error: connErr } = await adapter.testConnection(credentials)
    if (!connected) throw new Error(connErr ?? 'Connection test failed')

    // Fetch daily metrics
    const metrics: DailyMetricsPayload[] = await adapter.fetchDailyMetrics(
      credentials, hotelId, fromDate, toDate
    )

    // Upsert daily_metrics
    if (metrics.length > 0) {
      const { error: upsertErr } = await supabase
        .from('daily_metrics')
        .upsert(metrics, { onConflict: 'hotel_id,date' })

      if (upsertErr) {
        result.errors.push(`daily_metrics upsert failed: ${upsertErr.message}`)
        result.recordsFailed += metrics.length
      } else {
        result.recordsSynced += metrics.length
      }
    }

    // Fetch + upsert revenue by channel (optional)
    if (adapter.fetchRevenueByChannel) {
      const channels: RevenueByChannelPayload[] = await adapter.fetchRevenueByChannel(
        credentials, hotelId, fromDate, toDate
      )
      if (channels.length > 0) {
        const { error: chanErr } = await supabase
          .from('revenue_by_channel')
          .upsert(channels, { onConflict: 'hotel_id,date,channel' })

        if (chanErr) {
          result.errors.push(`revenue_by_channel upsert failed: ${chanErr.message}`)
        } else {
          result.recordsSynced += channels.length
        }
      }
    }

    result.success = result.recordsFailed === 0

    // Update sync_log to success/partial
    const finalStatus = result.recordsFailed > 0 ? 'partial' : 'success'
    await supabase
      .from('sync_logs')
      .update({
        status: finalStatus,
        records_synced: result.recordsSynced,
        records_failed: result.recordsFailed,
        error_message: result.errors.length ? result.errors.join('; ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId)

    // Update integration status + last_sync_at
    await supabase
      .from('integrations')
      .update({ status: 'active', last_sync_at: new Date().toISOString(), error_message: null })
      .eq('id', integrationId)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    result.errors.push(msg)

    await supabase
      .from('sync_logs')
      .update({
        status: 'failed',
        error_message: msg,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId)

    await supabase
      .from('integrations')
      .update({ status: 'error', error_message: msg })
      .eq('id', integrationId)
  }

  return result
}
