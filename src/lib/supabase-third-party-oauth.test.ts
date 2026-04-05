import { describe, expect, it, vi, afterEach } from 'vitest';
import { isQuickBooksOAuthReturnInUrl } from './supabase-third-party-oauth';

function mockLocation(search: string, pathname = '/') {
  vi.stubGlobal('window', {
    location: { search, pathname },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isQuickBooksOAuthReturnInUrl', () => {
  it('is true when realmId is present', () => {
    mockLocation('?code=abc&state=xyz&realmId=12345');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true when realm_id is present', () => {
    mockLocation('?code=abc&state=xyz&realm_id=12345');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true for hotel OAuth state (hotel_uuid:nonce) without realmId', () => {
    const hotel = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const nonce = '11111111-2222-3333-4444-555555555555';
    mockLocation(`?code=intuit-code&state=${encodeURIComponent(`${hotel}:${nonce}`)}`);
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true on /integrations with code+state even if state shape is unexpected (avoid Supabase eating Intuit code)', () => {
    mockLocation('?code=intuit-code&state=opaque-string', '/integrations');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true on /integrations/qb-callback with code+state (preferred Intuit redirect)', () => {
    mockLocation('?code=intuit-code&state=opaque-string', '/integrations/qb-callback');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true on /integrations/qb-callback even without code (disable PKCE before params are parsed)', () => {
    mockLocation('', '/integrations/qb-callback');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is false when only code+state look unrelated and path is not /integrations', () => {
    mockLocation('?code=supabase-pkce&state=opaque-string', '/auth');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(false);
  });

  it('is false when search is empty', () => {
    mockLocation('');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(false);
  });
});
