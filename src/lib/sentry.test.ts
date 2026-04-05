import { describe, expect, it, vi } from 'vitest';
import {
  createSentryMutationCache,
  getSentryReactQueryOptions,
  initSentry,
} from './sentry';

describe('getSentryReactQueryOptions', () => {
  it('provides query onError handler', () => {
    const opts = getSentryReactQueryOptions();
    expect(opts.queries?.onError).toBeTypeOf('function');
  });
});

describe('createSentryMutationCache', () => {
  it('returns a MutationCache', () => {
    const cache = createSentryMutationCache();
    expect(cache).toBeDefined();
    expect(typeof cache.clear).toBe('function');
  });
});

describe('initSentry', () => {
  it('does not throw when Sentry is disabled via VITE_SENTRY_DSN', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'false');
    expect(() => initSentry()).not.toThrow();
    expect(() => initSentry(undefined)).not.toThrow();
    vi.unstubAllEnvs();
  });
});
