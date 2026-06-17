import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set for seeding');
  }

  const prisma = new PrismaClient();
  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      username: 'admin',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
