import { INestApplication } from '@nestjs/common';
import request from 'supertest';

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
