import { describe, expect, it } from 'vitest';
import {
  createSentryMutationCache,
  getSentryReactQueryOptions,
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
