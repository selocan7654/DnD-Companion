import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EmailVerifiedGuard } from './email-verified.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_VERIFIED_EMAIL_KEY } from '../decorators/require-verified-email.decorator';

function createMockContext(
  user?:
    | {
        emailVerifiedAt: Date | null;
      }
    | undefined,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('EmailVerifiedGuard', () => {
  let guard: EmailVerifiedGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new EmailVerifiedGuard(reflector);
  });

  it('allows public endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return false;
    });

    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('allows when verified email not required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(guard.canActivate(createMockContext({ emailVerifiedAt: null }))).toBe(true);
  });

  it('allows verified user on protected write endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === REQUIRE_VERIFIED_EMAIL_KEY) return true;
      return false;
    });

    expect(guard.canActivate(createMockContext({ emailVerifiedAt: new Date() }))).toBe(true);
  });

  it('allows when no user on protected write endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === REQUIRE_VERIFIED_EMAIL_KEY) return true;
      return false;
    });

    expect(guard.canActivate(createMockContext(undefined))).toBe(true);
  });

  it('blocks unverified user on protected write endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === REQUIRE_VERIFIED_EMAIL_KEY) return true;
      return false;
    });

    expect(() => guard.canActivate(createMockContext({ emailVerifiedAt: null }))).toThrow(
      'Please verify your email to perform this action',
    );
  });
});
