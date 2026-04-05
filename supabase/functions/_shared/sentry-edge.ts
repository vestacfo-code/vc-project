/**
 * Sentry for Supabase Edge (Deno). Uses secret SENTRY_DSN.
 * Wrap handlers with sentryServe("function-name", handler) so uncaught errors are reported.
 * For errors caught inside try/catch, call captureEdgeException(error, { ... }).
 */
import * as Sentry from "npm:@sentry/deno@10";

let initialized = false;

function ensureInit(): void {
  if (initialized) return;
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn?.trim()) return;
  initialized = true;
  Sentry.init({
    dsn: dsn.trim(),
    environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
    release: Deno.env.get("SENTRY_RELEASE") ?? undefined,
    defaultIntegrations: false,
    tracesSampleRate: Number(Deno.env.get("SENTRY_TRACES_SAMPLE_RATE") ?? "0.1"),
  });
}

export function isSentryEnabled(): boolean {
  return Boolean(Deno.env.get("SENTRY_DSN")?.trim());
}

/**
 * Wrap an Edge handler: reports uncaught errors and returns 500 JSON.
 * No-op pass-through when SENTRY_DSN is unset.
 */
export function sentryServe(
  functionName: string,
  handler: (req: Request) => Response | Promise<Response>,
): (req: Request) => Promise<Response> {
  ensureInit();
  return async (req: Request): Promise<Response> => {
    if (!isSentryEnabled()) {
      return await handler(req);
    }
    try {
      return await handler(req);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          edge_function: functionName,
          region: Deno.env.get("SB_REGION") ?? "unknown",
        },
        extra: {
          execution_id: Deno.env.get("SB_EXECUTION_ID") ?? "",
          deployment_id: Deno.env.get("DENO_DEPLOYMENT_ID") ?? "",
          method: req.method,
          url: req.url,
        },
      });
      await Sentry.flush(2000);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

/** Use inside catch blocks when you handle errors but still want Sentry. */
export async function captureEdgeException(
  error: unknown,
  extra?: Record<string, unknown>,
): Promise<void> {
  if (!isSentryEnabled()) return;
  ensureInit();
  Sentry.captureException(error, { extra: extra ?? {} });
  await Sentry.flush(2000);
}
