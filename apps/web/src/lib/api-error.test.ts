import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from '@/lib/api-error';

describe('getApiErrorMessage', () => {
  it('returns LAST_ADMIN message from API envelope', () => {
    const message = getApiErrorMessage(
      {
        status: 422,
        data: {
          statusCode: 422,
          error: 'LAST_ADMIN',
          message: 'Cannot remove the last admin from the system',
        },
      },
      'fallback',
    );

    expect(message).toBe('Cannot remove the last admin from the system');
  });
});
