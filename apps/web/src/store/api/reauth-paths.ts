import type { FetchArgs } from '@reduxjs/toolkit/query';

/** Public auth endpoints — 401 means invalid credentials/input, not an expired session. */
export const NO_REAUTH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/password-reset/request',
  '/auth/password-reset/confirm',
  '/auth/logout',
]);

export function getRequestPath(args: string | FetchArgs): string {
  const url = typeof args === 'string' ? args : args.url;
  return url.split('?')[0] ?? url;
}

export function shouldAttemptReauth(args: string | FetchArgs): boolean {
  const path = getRequestPath(args);
  return path !== '/auth/refresh' && !NO_REAUTH_PATHS.has(path);
}

export function shouldRefreshAfterUnauthorized(
  hadAccessToken: boolean,
  args: string | FetchArgs,
): boolean {
  return hadAccessToken && shouldAttemptReauth(args);
}
