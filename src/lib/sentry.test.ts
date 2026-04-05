import { describe, expect, it } from 'vitest';
import { getSentryReactQueryOptions } from './sentry';

describe('getSentryReactQueryOptions', () => {
  it('provides query and mutation onError handlers', () => {
    const opts = getSentryReactQueryOptions();
    expect(opts.queries?.onError).toBeTypeOf('function');
    expect(opts.mutations?.onError).toBeTypeOf('function');
  });
});
