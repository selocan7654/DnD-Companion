import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';

import { DEFAULT_TEST_PASSWORD } from './factories/user.factory';

export interface LoginResult {
  accessToken: string;
  refreshCookie: string;
}

export async function loginAsUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });

  const cookies = response.headers['set-cookie'];
  const refreshCookie = Array.isArray(cookies) ? (cookies[0] ?? '') : '';

  return {
    accessToken: response.body.data.accessToken as string,
    refreshCookie,
  };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export function extractRefreshToken(cookieHeader: string): string {
  const match = cookieHeader.match(/refreshToken=([^;]+)/);
  return match?.[1] ?? '';
}

/** Login while active, then deactivate — returns token that should fail on next request. */
export async function accessTokenForDeactivatedUser(
  app: INestApplication,
  prisma: PrismaClient,
  user: User,
): Promise<string> {
  const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
  return accessToken;
}
