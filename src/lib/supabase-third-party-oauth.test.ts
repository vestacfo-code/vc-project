import { describe, expect, it, vi, afterEach } from 'vitest';
import { isQuickBooksOAuthReturnInUrl } from './supabase-third-party-oauth';

function mockSearch(search: string) {
  vi.stubGlobal('window', {
    location: { search },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isQuickBooksOAuthReturnInUrl', () => {
  it('is true when realmId is present', () => {
    mockSearch('?code=abc&state=xyz&realmId=12345');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true when realm_id is present', () => {
    mockSearch('?code=abc&state=xyz&realm_id=12345');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is true for hotel OAuth state (hotel_uuid:nonce) without realmId', () => {
    const hotel = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const nonce = '11111111-2222-3333-4444-555555555555';
    mockSearch(`?code=intuit-code&state=${encodeURIComponent(`${hotel}:${nonce}`)}`);
    expect(isQuickBooksOAuthReturnInUrl()).toBe(true);
  });

  it('is false when only code+state look unrelated (no realmId, wrong state shape)', () => {
    mockSearch('?code=supabase-pkce&state=opaque-string');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(false);
  });

  it('is false when search is empty', () => {
    mockSearch('');
    expect(isQuickBooksOAuthReturnInUrl()).toBe(false);
  });
});
