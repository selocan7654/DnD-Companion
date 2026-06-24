import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

let userCounter = 0;

export const DEFAULT_TEST_PASSWORD = 'TestPassword123';

export interface CreateTestUserOptions {
  email?: string;
  username?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  emailVerifiedAt?: Date | null;
}

export async function createTestUser(prisma: PrismaClient, overrides: CreateTestUserOptions = {}) {
  userCounter += 1;
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD;
  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

  return prisma.user.create({
    data: {
      email: overrides.email ?? `user${userCounter}@test.local`,
      username: overrides.username ?? `user${userCounter}`,
      passwordHash,
      role: overrides.role ?? Role.USER,
      isActive: overrides.isActive ?? true,
      emailVerifiedAt:
        overrides.emailVerifiedAt !== undefined ? overrides.emailVerifiedAt : new Date(),
    },
  });
}
