import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function createMockContext(user?: { role: Role }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createMockContext({ role: Role.USER }))).toBe(true);
  });

  it('allows ADMIN when Role.ADMIN is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    expect(guard.canActivate(createMockContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('throws 403 when USER lacks required ADMIN role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    expect(() => guard.canActivate(createMockContext({ role: Role.USER }))).toThrow(
      ForbiddenException,
    );
  });

  it('throws 403 when user is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    expect(() => guard.canActivate(createMockContext())).toThrow(ForbiddenException);
  });
});
