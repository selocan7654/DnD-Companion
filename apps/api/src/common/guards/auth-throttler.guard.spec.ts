import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthThrottlerGuard } from './auth-throttler.guard';

function createMockContext(): ExecutionContext {
  const res = {
    setHeader: jest.fn(),
  };

  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ ip: '127.0.0.1' }),
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

describe('AuthThrottlerGuard', () => {
  it('throws 429 with Retry-After and standard envelope', async () => {
    const guard = new AuthThrottlerGuard({ throttlers: [] }, {} as never, new Reflector());
    const context = createMockContext();
    const response = context.switchToHttp().getResponse<{ setHeader: jest.Mock }>();

    await expect(guard['throwThrottlingException'](context)).rejects.toBeInstanceOf(HttpException);

    try {
      await guard['throwThrottlingException'](context);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(429);
      expect(httpError.getResponse()).toEqual({
        statusCode: 429,
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      });
    }

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '900');
  });
});
