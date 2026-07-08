import type { ErrorEvent } from '@sentry/node';

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'newpassword',
  'currentpassword',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'cookie',
  'smtp_pass',
  's3_secret_key',
  'jwt_access_secret',
  'jwt_refresh_secret',
]);

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return '[Filtered]';
  }

  if (value && typeof value === 'object') {
    return scrubObject(value as Record<string, unknown>);
  }

  return value;
}

function scrubObject(data: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    scrubbed[key] = scrubValue(key, value);
  }

  return scrubbed;
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request?.headers) {
    event.request.headers = scrubObject(
      event.request.headers as Record<string, unknown>,
    ) as typeof event.request.headers;
  }

  if (event.request?.data && typeof event.request.data === 'object') {
    event.request.data = scrubObject(event.request.data as Record<string, unknown>);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (!breadcrumb.data || typeof breadcrumb.data !== 'object') {
        return breadcrumb;
      }

      return {
        ...breadcrumb,
        data: scrubObject(breadcrumb.data as Record<string, unknown>),
      };
    });
  }

  return event;
}
