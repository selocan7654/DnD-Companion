import { CharacterVisibility, PrismaClient } from '@prisma/client';

export interface CreateTestCharacterOptions {
  name?: string;
  race?: string;
  className?: string;
  subclass?: string;
  level?: number;
  background?: string;
  campaignId?: string | null;
  visibility?: CharacterVisibility;
}

let characterCounter = 0;

export async function createTestCharacter(
  prisma: PrismaClient,
  ownerId: string,
  overrides: CreateTestCharacterOptions = {},
) {
  characterCounter += 1;

  return prisma.character.create({
    data: {
      name: overrides.name ?? `Test Character ${characterCounter}`,
      ownerId,
      race: overrides.race,
      className: overrides.className,
      subclass: overrides.subclass,
      level: overrides.level ?? 1,
      background: overrides.background,
      campaignId: overrides.campaignId ?? null,
      visibility: overrides.visibility ?? CharacterVisibility.PRIVATE,
    },
  });
}
