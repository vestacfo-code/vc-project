import * as Sentry from '@sentry/react';
import { supabaseIntegration } from '@sentry/browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { DefaultOptions } from '@tanstack/react-query';
import { MutationCache } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

/** Built-in DSN when VITE_SENTRY_DSN is unset. Set VITE_SENTRY_DSN=false to disable browser Sentry. */
const FALLBACK_SENTRY_DSN =
  'https://70752a9bf8b83367e99bb3d031712797@o4511165929684992.ingest.us.sentry.io/4511165952229376';

const release =
  import.meta.env.VITE_SENTRY_RELEASE?.trim() ||
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA?.trim() ||
  undefined;

/** Default true (matches Sentry quickstart). Set VITE_SENTRY_SEND_DEFAULT_PII=false to opt out. */
const sendDefaultPii =
  import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII !== 'false';

/** Resolved DSN for browser SDK, or undefined if Sentry is turned off. */
export function getBrowserSentryDsn(): string | undefined {
  const raw = import.meta.env.VITE_SENTRY_DSN;
  if (raw === 'false' || raw === '0') return undefined;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed.length > 0) return trimmed;
  return FALLBACK_SENTRY_DSN;
}

export function initSentry(supabaseClient?: SupabaseClient<Database>) {
  const dsn = getBrowserSentryDsn();
  if (!dsn) return;

  const integrations = [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ];

  if (supabaseClient) {
    integrations.splice(1, 0, supabaseIntegration({ supabaseClient }));
  }

  Sentry.init({
    dsn,
    sendDefaultPii,
    environment: import.meta.env.MODE,
    release,
    integrations,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1,
    replaysOnErrorSampleRate: 1,
  });
}

/** Default TanStack Query handlers so failed queries show up in Sentry. */
export function getSentryReactQueryOptions(): DefaultOptions {
  return {
    queries: {
      onError: (error, query) => {
        if (query.meta?.skipSentry === true) return;
        Sentry.captureException(error, { tags: { source: 'react-query' } });
      },
    },
  };
}

/** Mutation failures use MutationCache so we can read `meta.skipSentry`. */
export function createSentryMutationCache() {
  return new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.meta?.skipSentry === true) return;
      Sentry.captureException(error, {
        tags: { source: 'react-query-mutation' },
      });
    },
  });
}

export { Sentry };
