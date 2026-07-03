import { HomebrewStatus, HomebrewType, Prisma, PrismaClient, Source } from '@prisma/client';

let homebrewCounter = 0;

export const DEFAULT_FEAT_DATA = {
  benefit: 'You gain advantage on ability checks.',
  category: 'General',
};

export const DEFAULT_MAGIC_ITEM_DATA = {
  rarity: 'Rare',
  type: 'Weapon (longsword)',
  attunement: true,
  attunement_requirement: null,
  properties: 'You gain a +1 bonus to attack and damage rolls.',
  charges: null,
  recharge: null,
};

export interface CreateTestHomebrewOptions {
  name?: string;
  type?: HomebrewType;
  source?: Source;
  status?: HomebrewStatus;
  ownerId?: string | null;
  description?: string;
  data?: Record<string, unknown>;
  publishedAt?: Date | null;
}

export async function createTestHomebrew(
  prisma: PrismaClient,
  ownerId: string | null,
  overrides: CreateTestHomebrewOptions = {},
) {
  homebrewCounter += 1;
  const type = overrides.type ?? HomebrewType.FEAT;
  const source = overrides.source ?? Source.HOMEBREW;
  const status = overrides.status ?? HomebrewStatus.DRAFT;

  return prisma.homebrewItem.create({
    data: {
      name: overrides.name ?? `Test Homebrew ${homebrewCounter}`,
      type,
      source,
      ownerId: source === Source.HOMEBREW ? (overrides.ownerId ?? ownerId) : null,
      status,
      description: overrides.description ?? 'A test homebrew item',
      publishedAt:
        overrides.publishedAt !== undefined
          ? overrides.publishedAt
          : status === HomebrewStatus.PUBLISHED
            ? new Date()
            : null,
      data: (overrides.data ?? DEFAULT_FEAT_DATA) as Prisma.InputJsonValue,
    },
  });
}

export async function createOfficialHomebrew(
  prisma: PrismaClient,
  overrides: CreateTestHomebrewOptions = {},
) {
  return createTestHomebrew(prisma, null, {
    ...overrides,
    source: overrides.source ?? Source.PHB,
    ownerId: null,
    status: HomebrewStatus.PUBLISHED,
  });
}
