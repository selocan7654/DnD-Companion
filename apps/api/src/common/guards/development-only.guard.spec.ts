import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvConfig } from '../../config/env.validation';
import { DevelopmentOnlyGuard } from './development-only.guard';

describe('DevelopmentOnlyGuard', () => {
  function createGuard(nodeEnv: EnvConfig['NODE_ENV']): DevelopmentOnlyGuard {
    const configService = {
      get: jest.fn().mockReturnValue(nodeEnv),
    } as unknown as ConfigService<EnvConfig, true>;
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
