import * as Sentry from '@sentry/react';
import type { DefaultOptions } from '@tanstack/react-query';
import { MutationCache } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const release =
  import.meta.env.VITE_SENTRY_RELEASE?.trim() ||
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA?.trim() ||
  undefined;

export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release,
    integrations: [
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
    ],
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
