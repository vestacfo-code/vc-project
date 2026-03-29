import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return; // no-op in local dev until DSN is set

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'production' | 'development'
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 10% of sessions for session replay
    replaysSessionSampleRate: 0.1,
    // Capture 100% of sessions where an error occurred
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
