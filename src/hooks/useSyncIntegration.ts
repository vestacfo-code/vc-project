import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { syncIntegration } from '@/lib/integrations'
import { format, subDays } from 'date-fns'

interface SyncOptions {
  integrationId: string
  hotelId: string
  provider: string
  credentials: Record<string, string>
  daysBack?: number
}

export function useSyncIntegration() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ integrationId, hotelId, provider, credentials, daysBack = 7 }: SyncOptions) => {
      const toDate = format(new Date(), 'yyyy-MM-dd')
      const fromDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd')
      return syncIntegration(integrationId, hotelId, provider, credentials, fromDate, toDate)
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Synced ${result.recordsSynced} records successfully`)
      } else if (result.recordsSynced > 0) {
        toast.warning(`Partial sync: ${result.recordsSynced} synced, ${result.recordsFailed} failed`)
      } else {
        toast.error(`Sync failed: ${result.errors[0] ?? 'Unknown error'}`)
      }
      // Invalidate dashboard data so charts refresh
      queryClient.invalidateQueries({ queryKey: ['daily_metrics'] })
      queryClient.invalidateQueries({ queryKey: ['sync_logs'] })
    },
    onError: (err: Error) => {
      toast.error(`Sync error: ${err.message}`)
    },
  })

  return {
    sync: mutation.mutate,
    isSyncing: mutation.isPending,
    lastResult: mutation.data,
  }
}
