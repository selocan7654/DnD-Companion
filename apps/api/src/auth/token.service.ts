import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { generateSecureToken, hashToken } from '../common/utils/token-hash.util';
import { PrismaService } from '../common/prisma/prisma.service';
import { EnvConfig } from '../config/env.validation';
import { AuthCookieResponse } from './interfaces/auth-cookie.interface';
import { AuthUser, JwtPayload } from './interfaces/auth-user.interface';

export const REFRESH_COOKIE_NAME = 'refreshToken';

@Injectable()
export class TokenService {
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    this.accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
    this.refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    this.isProduction = this.configService.get('NODE_ENV', { infer: true }) === 'production';
  }

  generateAccessToken(user: AuthUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      emailVerified: user.emailVerifiedAt !== null,
    };
    return this.jwtService.sign(payload, { expiresIn: this.accessExpiresIn } as JwtSignOptions);
  }

  createRefreshTokenPair(): { plainToken: string; tokenHash: string } {
    const plainToken = generateSecureToken();
    return { plainToken, tokenHash: hashToken(plainToken) };
  }

  getRefreshExpiresAt(): Date {
    const days = this.parseRefreshDurationDays(this.refreshExpiresIn);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  setRefreshCookie(res: AuthCookieResponse, plainToken: string): void {
    const maxAgeMs = this.parseRefreshDurationDays(this.refreshExpiresIn) * 24 * 60 * 60 * 1000;
    res.cookie(REFRESH_COOKIE_NAME, plainToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: maxAgeMs,
    });
  }

  clearRefreshCookie(res: AuthCookieResponse): void {
    res.cookie(REFRESH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 0,
    });
  }

  async persistRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async rotateRefreshToken(
    plainToken: string,
    res: AuthCookieResponse,
  ): Promise<{ accessToken: string }> {
    const tokenHash = hashToken(plainToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    if (stored.isRevoked) {
      await this.revokeAllUserRefreshTokens(stored.userId);
      throw new UnauthorizedException({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    await this.revokeRefreshToken(tokenHash);

    const user = this.toAuthUser(stored.user);
    const accessToken = this.generateAccessToken(user);
    const { plainToken: newPlain, tokenHash: newHash } = this.createRefreshTokenPair();
    await this.persistRefreshToken(stored.userId, newHash, this.getRefreshExpiresAt());
    this.setRefreshCookie(res, newPlain);

    return { accessToken };
  }

  async logout(plainToken: string | undefined, res: AuthCookieResponse): Promise<void> {
    if (plainToken) {
      await this.revokeRefreshToken(hashToken(plainToken));
    }
    this.clearRefreshCookie(res);
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    username: string;
    role: AuthUser['role'];
    isActive: boolean;
    emailVerifiedAt: Date | null;
    avatarUrl: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      avatarUrl: user.avatarUrl,
    };
  }

  private parseRefreshDurationDays(duration: string): number {
    const match = duration.match(/^(\d+)d$/);
    if (!match) {
      return 30;
    }
    return Number.parseInt(match[1], 10);
  }
}
