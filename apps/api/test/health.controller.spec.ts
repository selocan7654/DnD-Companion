import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../src/common/prisma/prisma.service';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok status with database connected', async () => {
    const result = await controller.getHealth();
    expect(result).toEqual({
      data: {
        status: 'ok',
        database: 'connected',
      },
    });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});
