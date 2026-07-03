import { describe, expect, it } from 'vitest';

import {
  getRequestPath,
  shouldAttemptReauth,
  shouldRefreshAfterUnauthorized,
} from './reauth-paths';

describe('reauth-paths', () => {
  it('skips reauth for public auth endpoints', () => {
    expect(shouldAttemptReauth('/auth/login')).toBe(false);
    expect(shouldAttemptReauth('/auth/register')).toBe(false);
    expect(shouldAttemptReauth('/auth/password-reset/request')).toBe(false);
    expect(shouldAttemptReauth('/auth/refresh')).toBe(false);
  });

  it('attempts reauth for protected endpoints', () => {
    expect(shouldAttemptReauth('/campaigns')).toBe(true);
    expect(shouldAttemptReauth({ url: '/characters/abc', method: 'GET' })).toBe(true);
  });

  it('strips query params when resolving request path', () => {
    expect(getRequestPath('/auth/verify-email?token=abc')).toBe('/auth/verify-email');
  });

  it('does not refresh after login 401 without an access token', () => {
    expect(shouldRefreshAfterUnauthorized(false, '/auth/login')).toBe(false);
  });

  it('does not refresh after login 401 even with a stale access token', () => {
    expect(shouldRefreshAfterUnauthorized(true, '/auth/login')).toBe(false);
  });

  it('refreshes after protected endpoint 401 when access token exists', () => {
    expect(shouldRefreshAfterUnauthorized(true, '/campaigns')).toBe(true);
  });

  it('does not refresh after protected endpoint 401 without access token', () => {
    expect(shouldRefreshAfterUnauthorized(false, '/campaigns')).toBe(false);
  });
});
