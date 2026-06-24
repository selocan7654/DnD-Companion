import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

function createMockContext(): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({}),
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

  it('allows public endpoints without calling passport', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const superSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');

    const result = guard.canActivate(createMockContext());

    expect(result).toBe(true);
    expect(superSpy).not.toHaveBeenCalled();
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
});
