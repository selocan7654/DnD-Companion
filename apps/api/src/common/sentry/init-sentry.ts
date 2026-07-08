import * as Sentry from '@sentry/nestjs';

import { scrubSentryEvent } from './sentry-scrub';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    beforeSend: scrubSentryEvent,
  });
}
