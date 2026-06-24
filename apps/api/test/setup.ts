import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const apiRoot = resolve(__dirname, '..');

function ensureTestEnv(): void {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    process.env.TEST_DATABASE_URL ??
    'postgresql://dnd_user:dnd_local_pass@localhost:5432/dnd_companion?schema=public';
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-characters';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-characters';
  process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
}

ensureTestEnv();

export const prisma = new PrismaClient();

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

beforeAll(async () => {
  await redis.connect().catch(() => undefined);
  execSync('npx prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env },
    stdio: 'inherit',
  });
});

afterEach(async () => {
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  if (redis.status === 'ready') {
    await redis.flushdb();
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  if (redis.status === 'ready') {
    await redis.quit();
  }
});
