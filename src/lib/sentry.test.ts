import { describe, expect, it } from 'vitest';
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
  it('does not throw when DSN is absent (typical in CI / unit tests)', () => {
    expect(() => initSentry()).not.toThrow();
    expect(() => initSentry(undefined)).not.toThrow();
  });
});
