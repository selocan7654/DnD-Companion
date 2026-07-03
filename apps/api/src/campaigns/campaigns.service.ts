import { randomBytes } from 'node:crypto';

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Campaign, Prisma } from '@prisma/client';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AlreadyMemberException } from '../common/exceptions/already-member.exception';
import { InvalidInviteTokenException } from '../common/exceptions/invalid-invite-token.exception';
import { CampaignPolicy } from '../common/policies/campaign.policy';
import { PrismaService } from '../common/prisma/prisma.service';
import { EnvConfig } from '../config/env.validation';
import { CampaignListQueryDto } from './dto/campaign-list-query.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

type CampaignWithMembers = Campaign & {
  members: Array<{ userId: string }>;
  _count?: { members: number; characters: number };
};

const campaignInclude = {
  members: { select: { userId: true } },
} satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async create(user: AuthUser, dto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        setting: dto.setting,
        ownerId: user.id,
      },
    });

    return { data: this.toCampaignResponse(campaign) };
  }

  async findAll(user: AuthUser, query: CampaignListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const search = query.search?.trim();
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';

    const where: Prisma.CampaignWhereInput = {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' as const },
          }
        : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.campaign.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      include: {
        members: { select: { userId: true } },
      },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    const data = page.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      setting: campaign.setting,
      bannerUrl: campaign.bannerUrl,
      role: campaign.ownerId === user.id ? ('DM' as const) : ('PLAYER' as const),
      memberCount: campaign.members.length + 1,
      createdAt: campaign.createdAt,
    }));

    return {
      data,
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
      hasMore,
    };
  }

  async findOne(id: string, user: AuthUser) {
    const campaign = await this.loadCampaignOrThrow(id, user);

    return {
      data: {
        ...this.toCampaignResponse(campaign),
        memberCount: campaign.members.length + 1,
        assignedCharacterCount: campaign._count?.characters ?? 0,
      },
    };
  }

  async update(id: string, user: AuthUser, dto: UpdateCampaignDto) {
    const campaign = await this.loadCampaignOrThrow(id, user);

    if (!CampaignPolicy.canUpdate(user, campaign)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to update this campaign',
      });
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.bannerUrl !== undefined ? { bannerUrl: dto.bannerUrl } : {}),
        ...(dto.setting !== undefined ? { setting: dto.setting } : {}),
      },
    });

    return { data: this.toCampaignResponse(updated) };
  }

  async remove(id: string, user: AuthUser) {
    const campaign = await this.loadCampaignOrThrow(id, user);

    if (!CampaignPolicy.canDelete(user, campaign)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to delete this campaign',
      });
    }

    await this.prisma.campaign.delete({ where: { id } });
  }

  async regenerateInvite(id: string, user: AuthUser) {
    const campaign = await this.loadCampaignOrThrow(id, user);

    if (!CampaignPolicy.canManageInvite(user, campaign)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to manage invite links for this campaign',
      });
    }

    const inviteToken = randomBytes(32).toString('hex');
    await this.prisma.campaign.update({
      where: { id },
      data: { inviteToken },
    });

    return {
      data: {
        inviteToken,
        inviteUrl: this.buildInviteUrl(inviteToken),
      },
    };
  }

  async disableInvite(id: string, user: AuthUser) {
    const campaign = await this.loadCampaignOrThrow(id, user);

    if (!CampaignPolicy.canManageInvite(user, campaign)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to manage invite links for this campaign',
      });
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { inviteToken: null },
    });
  }

  async listMembers(id: string, user: AuthUser) {
    const campaign = await this.loadCampaignOrThrow(id, user);

    const [owner, members] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: campaign.ownerId },
        select: { id: true, username: true, avatarUrl: true },
      }),
      this.prisma.campaignMember.findMany({
        where: { campaignId: id },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: 'asc' },
      }),
    ]);

    if (!owner) {
      throw new NotFoundException();
    }

    const data = [
      {
        userId: owner.id,
        username: owner.username,
        avatarUrl: owner.avatarUrl,
        joinedAt: campaign.createdAt,
        role: 'DM' as const,
      },
      ...members.map((member) => ({
        userId: member.user.id,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl,
        joinedAt: member.joinedAt,
        role: 'PLAYER' as const,
      })),
    ];

    return { data };
  }

  async removeMember(campaignId: string, targetUserId: string, user: AuthUser) {
    const campaign = await this.loadCampaignOrThrow(campaignId, user);

    if (!CampaignPolicy.canRemoveMember(user, campaign, targetUserId)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to remove this member',
      });
    }

    if (campaign.ownerId === targetUserId) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Campaign owner cannot leave; delete the campaign instead',
      });
    }

    await this.prisma.$transaction([
      this.prisma.character.updateMany({
        where: { campaignId, ownerId: targetUserId },
        data: { campaignId: null },
      }),
      this.prisma.campaignMember.delete({
        where: {
          campaignId_userId: { campaignId, userId: targetUserId },
        },
      }),
    ]);
  }

  async previewInvite(token: string) {
    const campaign = await this.findCampaignByInviteToken(token);
    if (!campaign) {
      throw new InvalidInviteTokenException();
    }

    const [dm, memberCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: campaign.ownerId },
        select: { username: true },
      }),
      this.prisma.campaignMember.count({ where: { campaignId: campaign.id } }),
    ]);

    return {
      data: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        dmUsername: dm?.username ?? 'unknown',
        memberCount: memberCount + 1,
      },
    };
  }

  async joinCampaign(token: string, user: AuthUser) {
    const campaign = await this.findCampaignByInviteToken(token);
    if (!campaign) {
      throw new InvalidInviteTokenException();
    }

    if (campaign.ownerId === user.id) {
      throw new AlreadyMemberException();
    }

    const existingMember = await this.prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: { campaignId: campaign.id, userId: user.id },
      },
    });

    if (existingMember) {
      throw new AlreadyMemberException();
    }

    const member = await this.prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
      },
    });

    return {
      data: {
        campaignId: campaign.id,
        joinedAt: member.joinedAt,
      },
    };
  }

  private async loadCampaignOrThrow(id: string, user: AuthUser): Promise<CampaignWithMembers> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        ...campaignInclude,
        _count: { select: { members: true, characters: true } },
      },
    });

    if (!campaign || !CampaignPolicy.canRead(user, campaign)) {
      throw new NotFoundException();
    }

    return campaign;
  }

  private async findCampaignByInviteToken(token: string) {
    return this.prisma.campaign.findFirst({
      where: { inviteToken: token },
    });
  }

  private buildInviteUrl(token: string): string {
    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    return `${frontendUrl.replace(/\/$/, '')}/invite/${token}`;
  }

  private toCampaignResponse(campaign: Campaign) {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      bannerUrl: campaign.bannerUrl,
      setting: campaign.setting,
      ownerId: campaign.ownerId,
      inviteToken: campaign.inviteToken,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}
