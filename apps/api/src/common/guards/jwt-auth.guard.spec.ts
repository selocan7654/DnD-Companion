import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

function createMockContext(authHeader?: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authHeader ? { authorization: authHeader } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('allows public endpoints without auth header', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const superSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');

    const result = guard.canActivate(createMockContext());

    expect(result).toBe(true);
    expect(superSpy).not.toHaveBeenCalled();
    superSpy.mockRestore();
  });

  it('delegates to passport for public endpoints with auth header', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    guard.canActivate(createMockContext('Bearer token'));

    expect(superSpy).toHaveBeenCalled();
    superSpy.mockRestore();
  });

  it('delegates to passport for non-public endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    guard.canActivate(createMockContext());

    expect(superSpy).toHaveBeenCalled();
    superSpy.mockRestore();
  });

  describe('handleRequest', () => {
    it('returns null for public route without auth header', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.handleRequest(null, { id: 'user-1' }, null, createMockContext());

      expect(result).toBeNull();
    });

    it('throws for public route with invalid token', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(() =>
        guard.handleRequest(null, null, null, createMockContext('Bearer invalid')),
      ).toThrow();
    });

    it('returns user for public route with valid token', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const user = { id: 'user-1' };

      const result = guard.handleRequest(null, user, null, createMockContext('Bearer valid'));

      expect(result).toBe(user);
    });

    it('throws for protected route without user', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.handleRequest(null, null, null, createMockContext())).toThrow();
    });

    it('returns user for protected route with valid user', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const user = { id: 'user-1' };

      const result = guard.handleRequest(null, user, null, createMockContext('Bearer valid'));

      expect(result).toBe(user);
    });

    it('rethrows error for protected route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const error = new Error('passport failure');

      expect(() => guard.handleRequest(error, null, null, createMockContext())).toThrow(error);
    });
  });
});
