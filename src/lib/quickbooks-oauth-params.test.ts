import { describe, expect, it } from 'vitest'
import {
  isHotelQuickBooksOAuthRedirect,
  parseQuickBooksOAuthCallbackParams,
} from './quickbooks-oauth-params'

describe('parseQuickBooksOAuthCallbackParams', () => {
  it('reads code, realmId, state from standard Intuit query', () => {
    const q =
      '?code=auth-code-123&state=opaque&realmId=9341453478954053'
    expect(parseQuickBooksOAuthCallbackParams(q)).toEqual({
      code: 'auth-code-123',
      state: 'opaque',
      realmId: '9341453478954053',
    })
  })

  it('accepts realm_id and realmid aliases', () => {
    expect(
      parseQuickBooksOAuthCallbackParams('?code=c&state=s&realm_id=111'),
    ).toMatchObject({ realmId: '111' })
    expect(
      parseQuickBooksOAuthCallbackParams('?code=c&state=s&realmid=222'),
    ).toMatchObject({ realmId: '222' })
  })

  it('accepts auth_code alias for code', () => {
    expect(
      parseQuickBooksOAuthCallbackParams('?auth_code=c&state=s&realmId=1'),
    ).toMatchObject({ code: 'c' })
  })
})

describe('isHotelQuickBooksOAuthRedirect', () => {
  const hotel = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
  const nonce = '11111111-2222-3333-4444-555555555555'

  it('is true for code+state+realmId', () => {
    expect(
      isHotelQuickBooksOAuthRedirect(`?code=c&state=s&realmId=123`),
    ).toBe(true)
  })

  it('is true for code+state with hotel-scoped state even without realmId', () => {
    expect(
      isHotelQuickBooksOAuthRedirect(
        `?code=c&state=${encodeURIComponent(`${hotel}:${nonce}`)}`,
      ),
    ).toBe(true)
  })

  it('is false for unrelated code+state (no realm, not our state shape)', () => {
    expect(isHotelQuickBooksOAuthRedirect('?code=pkce&state=random')).toBe(false)
  })
})
