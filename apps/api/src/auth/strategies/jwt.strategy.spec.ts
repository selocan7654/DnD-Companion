import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: () => 'test-access-secret-minimum-32-characters' },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    strategy = moduleRef.get(JwtStrategy);
  });

  it('returns active user from validate', async () => {
    const user = {
      id: 'user-1',
      email: 'a@test.local',
      username: 'user1',
      role: 'USER',
      isActive: true,
      emailVerifiedAt: new Date(),
      avatarUrl: null,
    };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: 'user-1', role: 'USER', emailVerified: true }),
    ).resolves.toEqual(user);
  });

  it('rejects missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'missing', role: 'USER', emailVerified: false }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects deactivated user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.local',
      username: 'user1',
      role: 'USER',
      isActive: false,
      emailVerifiedAt: new Date(),
      avatarUrl: null,
    });

    await expect(
      strategy.validate({ sub: 'user-1', role: 'USER', emailVerified: true }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
