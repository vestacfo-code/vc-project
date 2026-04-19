import { FunctionsHttpError } from '@supabase/functions-js'

/**
 * Supabase `functions.invoke` returns a generic message for non-2xx responses.
 * The Edge Function JSON body (error, details, hint) is on the Response in `error.context`.
 */
export async function getSupabaseFunctionErrorMessage(
  err: unknown,
  fallback = 'Request failed',
): Promise<string> {
  if (err instanceof FunctionsHttpError && err.context) {
    try {
      const body = await err.context.clone().json()
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        const parts = [body.error]
        const details = (body as { details?: string }).details
        const hint = (body as { hint?: string }).hint
        if (typeof details === 'string' && details.trim()) parts.push(details.trim())
        if (typeof hint === 'string' && hint.trim()) parts.push(hint.trim())
        return parts.join(' — ')
      }
    } catch {
      /* use fallback */
    }
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
