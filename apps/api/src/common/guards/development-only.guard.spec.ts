import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DevelopmentOnlyGuard } from './development-only.guard';

describe('DevelopmentOnlyGuard', () => {
  function createGuard(nodeEnv: string): DevelopmentOnlyGuard {
    const configService = {
      get: jest.fn().mockReturnValue(nodeEnv),
    } as unknown as ConfigService;
    return new DevelopmentOnlyGuard(configService);
  }

  it('allows access in development', () => {
    const guard = createGuard('development');
    expect(guard.canActivate()).toBe(true);
  });

  it('throws NotFoundException outside development', () => {
    const guard = createGuard('test');
    expect(() => guard.canActivate()).toThrow(NotFoundException);
  });
});
