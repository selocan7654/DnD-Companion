import { PrismaClient } from '@prisma/client';

export interface CreateTestCampaignOptions {
  name?: string;
  description?: string;
  setting?: string;
  bannerUrl?: string;
  inviteToken?: string | null;
}

let campaignCounter = 0;

export async function createTestCampaign(
  prisma: PrismaClient,
  ownerId: string,
  overrides: CreateTestCampaignOptions = {},
) {
  campaignCounter += 1;

  return prisma.campaign.create({
    data: {
      name: overrides.name ?? `Test Campaign ${campaignCounter}`,
      description: overrides.description,
      setting: overrides.setting ?? 'Forgotten Realms',
      bannerUrl: overrides.bannerUrl,
      inviteToken: overrides.inviteToken,
      ownerId,
    },
  });
}

export async function addCampaignMember(prisma: PrismaClient, campaignId: string, userId: string) {
  return prisma.campaignMember.create({
    data: { campaignId, userId },
  });
}
