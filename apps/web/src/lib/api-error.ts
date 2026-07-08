import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import type { ApiErrorBody } from '@/types/api';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const fetchError = error as FetchBaseQueryError;
  if ('data' in fetchError && fetchError.data && typeof fetchError.data === 'object') {
    const body = fetchError.data as ApiErrorBody;
    if (body.error === 'LAST_ADMIN') {
      return body.message || 'Cannot remove the last admin from the system';
    }
    if (typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }
  }

  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const fetchError = error as FetchBaseQueryError;
  if ('data' in fetchError && fetchError.data && typeof fetchError.data === 'object') {
    const body = fetchError.data as ApiErrorBody;
    if (typeof body.error === 'string') {
      return body.error;
    }
  }

  return undefined;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const fetchError = error as FetchBaseQueryError;
  if (typeof fetchError.status === 'number') {
    return fetchError.status;
  }

  return undefined;
}
