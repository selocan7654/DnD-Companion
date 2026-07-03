import { HomebrewStatus, HomebrewType, Prisma, PrismaClient, Role, Source } from '@prisma/client';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const DEV_TEST_USERS = [
  { email: 'player1@test.local', username: 'player1' },
  { email: 'player2@test.local', username: 'player2' },
  { email: 'player3@test.local', username: 'player3' },
  { email: 'dm1@test.local', username: 'dm1' },
  { email: 'dm2@test.local', username: 'dm2' },
] as const;

const OFFICIAL_SEED_FILES = [
  'spells',
  'monsters',
  'feats',
  'backgrounds',
  'magic-items',
  'subclasses',
] as const;

type OfficialSeedItem = {
  name: string;
  type: HomebrewType;
  source: Source;
  description?: string;
  data: Record<string, unknown>;
};

function isOfficialSeedItem(value: unknown): value is OfficialSeedItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.name === 'string' &&
    typeof item.type === 'string' &&
    typeof item.source === 'string' &&
    item.source !== Source.HOMEBREW &&
    item.data !== null &&
    typeof item.data === 'object' &&
    !Array.isArray(item.data)
  );
}

async function upsertUser(
  prisma: PrismaClient,
  params: {
    email: string;
    username: string;
    passwordHash: string;
    role: Role;
  },
): Promise<void> {
  const userData = {
    email: params.email,
    passwordHash: params.passwordHash,
    role: params.role,
    isActive: true,
    emailVerifiedAt: new Date(),
  };

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: params.email }, { username: params.username }],
    },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: userData,
    });
  } else {
    await prisma.user.create({
      data: {
        ...userData,
        username: params.username,
      },
    });
  }
}

async function seedOfficialContent(prisma: PrismaClient): Promise<number> {
  const seedDataDir = path.join(__dirname, 'seed-data');
  let seededCount = 0;

  for (const file of OFFICIAL_SEED_FILES) {
    const filePath = path.join(seedDataDir, `${file}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const items: unknown[] = JSON.parse(raw);

    for (const entry of items) {
      if (!isOfficialSeedItem(entry)) {
        console.warn(`Skipping invalid official seed entry in ${file}.json`, entry);
        continue;
      }

      await prisma.homebrewItem.upsert({
        where: {
          name_type_source: {
            name: entry.name,
            type: entry.type,
            source: entry.source,
          },
        },
        update: {
          description: entry.description ?? null,
          data: entry.data as Prisma.InputJsonValue,
        },
        create: {
          name: entry.name,
          type: entry.type,
          source: entry.source,
          ownerId: null,
          status: HomebrewStatus.PUBLISHED,
          publishedAt: new Date(),
          description: entry.description ?? null,
          data: entry.data as Prisma.InputJsonValue,
        },
      });

      seededCount += 1;
    }
  }

  return seededCount;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set for seeding');
  }

  const prisma = new PrismaClient();
  const adminPasswordHash = await argon2.hash(password, ARGON2_OPTIONS);

  await upsertUser(prisma, {
    email,
    username: 'admin',
    passwordHash: adminPasswordHash,
    role: Role.ADMIN,
  });

  const seedTestUsers = process.env.SEED_TEST_USERS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if (seedTestUsers && !isProduction) {
    const testPassword = process.env.SEED_TEST_USER_PASSWORD ?? 'password123';
    const testPasswordHash = await argon2.hash(testPassword, ARGON2_OPTIONS);

    for (const user of DEV_TEST_USERS) {
      await upsertUser(prisma, {
        email: user.email,
        username: user.username,
        passwordHash: testPasswordHash,
        role: Role.USER,
      });
    }

    console.log(`Seeded ${DEV_TEST_USERS.length} development test users`);
  }

  const officialCount = await seedOfficialContent(prisma);
  console.log(`Seeded ${officialCount} official homebrew items`);

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
