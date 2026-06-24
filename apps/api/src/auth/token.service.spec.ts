import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../common/prisma/prisma.service';
import { hashToken } from '../common/utils/token-hash.util';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let tokenService: TokenService;
  let prisma: {
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('access-token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '30d',
                NODE_ENV: 'test',
              };
              return values[key];
            },
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    tokenService = moduleRef.get(TokenService);
  });

  it('revokes all refresh tokens on reuse detection', async () => {
    const plainToken = 'a'.repeat(64);
    prisma.refreshToken.findUnique.mockResolvedValue({
      userId: 'user-1',
      isRevoked: true,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        isActive: true,
        role: 'USER',
        emailVerifiedAt: new Date(),
        email: 'a@b.c',
        username: 'u',
        avatarUrl: null,
      },
    });

    const res = { cookie: jest.fn() };

    await expect(tokenService.rotateRefreshToken(plainToken, res)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRevoked: false },
      data: { isRevoked: true },
    });
  });

  it('rejects expired refresh tokens', async () => {
    const plainToken = 'b'.repeat(64);
    prisma.refreshToken.findUnique.mockResolvedValue({
      userId: 'user-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() - 60_000),
      user: {
        id: 'user-1',
        isActive: true,
        role: 'USER',
        emailVerifiedAt: new Date(),
        email: 'a@b.c',
        username: 'u',
        avatarUrl: null,
      },
    });

    await expect(
      tokenService.rotateRefreshToken(plainToken, { cookie: jest.fn() }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates valid refresh token', async () => {
    const plainToken = 'd'.repeat(64);
    prisma.refreshToken.findUnique.mockResolvedValue({
      userId: 'user-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        isActive: true,
        role: 'USER',
        emailVerifiedAt: new Date(),
        email: 'a@b.c',
        username: 'u',
        avatarUrl: null,
      },
    });
    prisma.refreshToken.create.mockResolvedValue({});

    const res = { cookie: jest.fn() };
    const result = await tokenService.rotateRefreshToken(plainToken, res);

    expect(result.accessToken).toBe('access-token');
    expect(res.cookie).toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects inactive user during refresh', async () => {
    const plainToken = 'e'.repeat(64);
    prisma.refreshToken.findUnique.mockResolvedValue({
      userId: 'user-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        isActive: false,
        role: 'USER',
        emailVerifiedAt: new Date(),
        email: 'a@b.c',
        username: 'u',
        avatarUrl: null,
      },
    });

    await expect(
      tokenService.rotateRefreshToken(plainToken, { cookie: jest.fn() }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout revokes token when cookie present', async () => {
    const plainToken = 'c'.repeat(64);
    const res = { cookie: jest.fn() };

    await tokenService.logout(plainToken, res);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: hashToken(plainToken), isRevoked: false },
      data: { isRevoked: true },
    });
    expect(res.cookie).toHaveBeenCalled();
  });
});
