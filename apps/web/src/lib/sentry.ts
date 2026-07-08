import * as Sentry from '@sentry/react';

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
]);

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key)) {
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

function scrubSentryEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
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

export function initSentry(): void {
  const dsn = import.meta.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    beforeSend: scrubSentryEvent,
  });
}
