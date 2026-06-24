import { Controller, Get } from '@nestjs/common';

import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async getHealth() {
    const health = await this.healthService.check();
    return { data: health };
  }
}
