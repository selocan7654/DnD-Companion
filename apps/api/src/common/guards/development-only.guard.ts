import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvConfig } from '../../config/env.validation';

@Injectable()
export class DevelopmentOnlyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  canActivate(): boolean {
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    if (nodeEnv !== 'development') {
      throw new NotFoundException();
    }

    return true;
  }
}
