import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditTargetType,
  HomebrewStatus,
  HomebrewType,
  Prisma,
  Role,
} from '@prisma/client';
import {
  getHomebrewDataSchema,
  HomebrewType as SharedHomebrewType,
  updateCharacterSchema,
} from '@dnd-companion/shared';
import type { ZodIssue } from 'zod';

import { LastAdminException } from '../common/exceptions/last-admin.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateCampaignDto } from '../campaigns/dto/update-campaign.dto';
import { UpdateCharacterDto } from '../characters/dto/update-character.dto';
import { UpdateHomebrewDto } from '../homebrew/dto/update-homebrew.dto';
import { AdminCampaignListQueryDto } from './dto/admin-campaign-list-query.dto';
import { AdminCharacterListQueryDto } from './dto/admin-character-list-query.dto';
import { AdminHomebrewListQueryDto } from './dto/admin-homebrew-list-query.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UpdateHomebrewStatusDto } from './dto/update-homebrew-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Users ──────────────────────────────────────────────────────────────

  async listUsers(query: AdminUserListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { username: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      select: this.userSelect,
    });

    return this.paginate(items, limit, (user) => this.toUserResponse(user));
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) {
      throw new NotFoundException();
    }
    return { data: this.toUserResponse(user) };
  }

  async changeRole(actorId: string, targetId: string, dto: ChangeRoleDto) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException();
    }

    if (target.role === dto.role) {
      return { data: this.toUserResponse(target) };
    }

    if (target.role === Role.ADMIN && dto.role === Role.USER) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new LastAdminException();
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetId },
        data: { role: dto.role },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.ROLE_CHANGED,
          targetType: AuditTargetType.USER,
          targetId,
          metadata: { oldRole: target.role, newRole: dto.role },
        },
      });

      return user;
    });

    return { data: this.toUserResponse(updated) };
  }

  async deactivateUser(actorId: string, targetId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException();
    }

    if (!target.isActive) {
      throw new ConflictException({
        error: 'ALREADY_DEACTIVATED',
        message: 'User is already deactivated',
      });
    }

    if (target.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new LastAdminException();
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetId },
        data: { isActive: false },
      });

      await tx.refreshToken.updateMany({
        where: { userId: targetId, isRevoked: false },
        data: { isRevoked: true },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.USER_DEACTIVATED,
          targetType: AuditTargetType.USER,
          targetId,
          metadata: {
            targetEmail: target.email,
            targetUsername: target.username,
          },
        },
      });

      return user;
    });

    return { data: this.toUserResponse(updated) };
  }

  async reactivateUser(actorId: string, targetId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException();
    }

    if (target.isActive) {
      throw new ConflictException({
        error: 'ALREADY_ACTIVE',
        message: 'User is already active',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetId },
        data: { isActive: true },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.USER_REACTIVATED,
          targetType: AuditTargetType.USER,
          targetId,
          metadata: {
            targetEmail: target.email,
            targetUsername: target.username,
          },
        },
      });

      return user;
    });

    return { data: this.toUserResponse(updated) };
  }

  // ── Campaigns ──────────────────────────────────────────────────────────

  async listCampaigns(query: AdminCampaignListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';
    const search = query.search?.trim();

    const where: Prisma.CampaignWhereInput = {
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.campaign.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      include: {
        owner: { select: { id: true, username: true, email: true, isActive: true } },
        _count: { select: { members: true, characters: true } },
      },
    });

    return this.paginate(items, limit, (campaign) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      bannerUrl: campaign.bannerUrl,
      setting: campaign.setting,
      ownerId: campaign.ownerId,
      ownerUsername: campaign.owner.username,
      ownerEmail: campaign.owner.email,
      ownerIsActive: campaign.owner.isActive,
      memberCount: campaign._count.members + 1,
      characterCount: campaign._count.characters,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    }));
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, email: true, isActive: true } },
        members: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
        _count: { select: { characters: true } },
      },
    });
    if (!campaign) {
      throw new NotFoundException();
    }

    return {
      data: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        bannerUrl: campaign.bannerUrl,
        setting: campaign.setting,
        ownerId: campaign.ownerId,
        ownerUsername: campaign.owner.username,
        ownerEmail: campaign.owner.email,
        ownerIsActive: campaign.owner.isActive,
        inviteToken: campaign.inviteToken,
        members: campaign.members.map((m) => ({
          userId: m.userId,
          username: m.user.username,
          email: m.user.email,
          joinedAt: m.joinedAt,
        })),
        memberCount: campaign.members.length + 1,
        characterCount: campaign._count.characters,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
    };
  }

  async updateCampaign(actorId: string, id: string, dto: UpdateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    const changedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof UpdateCampaignDto] !== undefined,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.bannerUrl !== undefined ? { bannerUrl: dto.bannerUrl } : {}),
          ...(dto.setting !== undefined ? { setting: dto.setting } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_EDITED,
          targetType: AuditTargetType.CAMPAIGN,
          targetId: id,
          metadata: {
            targetType: 'CAMPAIGN',
            targetName: campaign.name,
            changedFields,
          },
        },
      });

      return campaign;
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        bannerUrl: updated.bannerUrl,
        setting: updated.setting,
        ownerId: updated.ownerId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async deleteCampaign(actorId: string, id: string) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    await this.prisma.$transaction(async (tx) => {
      // Characters: campaignId SetNull via Prisma schema; members + dmNotes Cascade
      await tx.campaign.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_DELETED,
          targetType: AuditTargetType.CAMPAIGN,
          targetId: id,
          metadata: {
            targetType: 'CAMPAIGN',
            targetName: existing.name,
            ownerId: existing.ownerId,
          },
        },
      });
    });
  }

  // ── Characters ─────────────────────────────────────────────────────────

  async listCharacters(query: AdminCharacterListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';
    const search = query.search?.trim();

    const where: Prisma.CharacterWhereInput = {
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.character.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      include: {
        owner: { select: { id: true, username: true, email: true, isActive: true } },
      },
    });

    return this.paginate(items, limit, (character) => ({
      id: character.id,
      name: character.name,
      level: character.level,
      race: character.race,
      className: character.className,
      visibility: character.visibility,
      campaignId: character.campaignId,
      ownerId: character.ownerId,
      ownerUsername: character.owner.username,
      ownerEmail: character.owner.email,
      ownerIsActive: character.owner.isActive,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    }));
  }

  async getCharacter(id: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, email: true, isActive: true } },
      },
    });
    if (!character) {
      throw new NotFoundException();
    }

    return {
      data: {
        ...this.toCharacterAdminResponse(character),
        ownerUsername: character.owner.username,
        ownerEmail: character.owner.email,
        ownerIsActive: character.owner.isActive,
      },
    };
  }

  async updateCharacter(actorId: string, id: string, dto: UpdateCharacterDto) {
    const existing = await this.prisma.character.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    const parsed = updateCharacterSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Invalid character data',
        details: parsed.error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.') || null,
          issue: issue.message,
        })),
      });
    }

    const changedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof UpdateCharacterDto] !== undefined,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id },
        data: this.buildCharacterUpdateData(dto),
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_EDITED,
          targetType: AuditTargetType.CHARACTER,
          targetId: id,
          metadata: {
            targetType: 'CHARACTER',
            targetName: character.name,
            changedFields,
          },
        },
      });

      return character;
    });

    return { data: this.toCharacterAdminResponse(updated) };
  }

  async deleteCharacter(actorId: string, id: string) {
    const existing = await this.prisma.character.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.character.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_DELETED,
          targetType: AuditTargetType.CHARACTER,
          targetId: id,
          metadata: {
            targetType: 'CHARACTER',
            targetName: existing.name,
            ownerId: existing.ownerId,
          },
        },
      });
    });
  }

  // ── Homebrew ───────────────────────────────────────────────────────────

  async listHomebrew(query: AdminHomebrewListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';
    const search = query.search?.trim();

    const where: Prisma.HomebrewItemWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.homebrewItem.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      include: {
        owner: { select: { id: true, username: true, email: true, isActive: true } },
      },
    });

    return this.paginate(items, limit, (item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      source: item.source,
      status: item.status,
      description: item.description,
      imageUrl: item.imageUrl,
      ownerId: item.ownerId,
      ownerUsername: item.owner?.username ?? null,
      ownerEmail: item.owner?.email ?? null,
      ownerIsActive: item.owner?.isActive ?? null,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async getHomebrew(id: string) {
    const item = await this.prisma.homebrewItem.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, email: true, isActive: true } },
      },
    });
    if (!item) {
      throw new NotFoundException();
    }

    return {
      data: {
        id: item.id,
        name: item.name,
        type: item.type,
        source: item.source,
        status: item.status,
        description: item.description,
        imageUrl: item.imageUrl,
        data: item.data,
        ownerId: item.ownerId,
        ownerUsername: item.owner?.username ?? null,
        ownerEmail: item.owner?.email ?? null,
        ownerIsActive: item.owner?.isActive ?? null,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    };
  }

  async updateHomebrew(actorId: string, id: string, dto: UpdateHomebrewDto) {
    const existing = await this.prisma.homebrewItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    let parsedData: Prisma.InputJsonValue | undefined;
    if (dto.data !== undefined) {
      parsedData = this.validateHomebrewData(existing.type, dto.data);
    }

    const changedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof UpdateHomebrewDto] !== undefined,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.homebrewItem.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
          ...(parsedData !== undefined ? { data: parsedData } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_EDITED,
          targetType: AuditTargetType.HOMEBREW,
          targetId: id,
          metadata: {
            targetType: 'HOMEBREW',
            targetName: item.name,
            changedFields,
          },
        },
      });

      return item;
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        source: updated.source,
        status: updated.status,
        description: updated.description,
        imageUrl: updated.imageUrl,
        data: updated.data,
        ownerId: updated.ownerId,
        publishedAt: updated.publishedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async deleteHomebrew(actorId: string, id: string) {
    const existing = await this.prisma.homebrewItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.homebrewItem.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_DELETED,
          targetType: AuditTargetType.HOMEBREW,
          targetId: id,
          metadata: {
            targetType: 'HOMEBREW',
            targetName: existing.name,
            ownerId: existing.ownerId,
          },
        },
      });
    });
  }

  async updateHomebrewStatus(actorId: string, id: string, dto: UpdateHomebrewStatusDto) {
    const existing = await this.prisma.homebrewItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    if (existing.status === dto.status) {
      throw new UnprocessableEntityException({
        error: 'STATUS_UNCHANGED',
        message: `Homebrew item is already ${dto.status}`,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.homebrewItem.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.status === HomebrewStatus.PUBLISHED
            ? { publishedAt: existing.publishedAt ?? new Date() }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CONTENT_EDITED,
          targetType: AuditTargetType.HOMEBREW,
          targetId: id,
          metadata: {
            targetType: 'HOMEBREW',
            targetName: item.name,
            changedFields: ['status'],
            oldStatus: existing.status,
            newStatus: dto.status,
          },
        },
      });

      return item;
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        publishedAt: updated.publishedAt,
      },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private readonly userSelect = {
    id: true,
    email: true,
    username: true,
    avatarUrl: true,
    role: true,
    isActive: true,
    emailVerifiedAt: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.UserSelect;

  private toUserResponse(user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    role: Role;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toCharacterAdminResponse(character: {
    id: string;
    ownerId: string;
    campaignId: string | null;
    name: string;
    race: string | null;
    className: string | null;
    subclass: string | null;
    level: number;
    background: string | null;
    alignment: string | null;
    experiencePoints: number;
    abilityScores: Prisma.JsonValue;
    hitPointsMax: number | null;
    hitPointsCurrent: number | null;
    temporaryHitPoints: number;
    armorClass: number | null;
    speed: number | null;
    proficiencyBonus: number | null;
    savingThrows: Prisma.JsonValue;
    skills: Prisma.JsonValue;
    featuresAndTraits: Prisma.JsonValue;
    equipment: Prisma.JsonValue;
    spellSlots: Prisma.JsonValue;
    knownSpells: Prisma.JsonValue;
    deathSaves: Prisma.JsonValue;
    conditions: Prisma.JsonValue;
    notes: string | null;
    portraitUrl: string | null;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: character.id,
      ownerId: character.ownerId,
      campaignId: character.campaignId,
      name: character.name,
      race: character.race,
      className: character.className,
      subclass: character.subclass,
      level: character.level,
      background: character.background,
      alignment: character.alignment,
      experiencePoints: character.experiencePoints,
      abilityScores: character.abilityScores,
      hitPointsMax: character.hitPointsMax,
      hitPointsCurrent: character.hitPointsCurrent,
      temporaryHitPoints: character.temporaryHitPoints,
      armorClass: character.armorClass,
      speed: character.speed,
      proficiencyBonus: character.proficiencyBonus,
      savingThrows: character.savingThrows,
      skills: character.skills,
      featuresAndTraits: character.featuresAndTraits,
      equipment: character.equipment,
      spellSlots: character.spellSlots,
      knownSpells: character.knownSpells,
      deathSaves: character.deathSaves,
      conditions: character.conditions,
      notes: character.notes,
      portraitUrl: character.portraitUrl,
      visibility: character.visibility,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };
  }

  private buildCharacterUpdateData(dto: UpdateCharacterDto): Prisma.CharacterUpdateInput {
    const data: Prisma.CharacterUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.race !== undefined) data.race = dto.race;
    if (dto.className !== undefined) data.className = dto.className;
    if (dto.subclass !== undefined) data.subclass = dto.subclass;
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.background !== undefined) data.background = dto.background;
    if (dto.alignment !== undefined) data.alignment = dto.alignment;
    if (dto.experiencePoints !== undefined) data.experiencePoints = dto.experiencePoints;
    if (dto.abilityScores !== undefined) {
      data.abilityScores = dto.abilityScores as Prisma.InputJsonValue;
    }
    if (dto.hitPointsMax !== undefined) data.hitPointsMax = dto.hitPointsMax;
    if (dto.hitPointsCurrent !== undefined) data.hitPointsCurrent = dto.hitPointsCurrent;
    if (dto.temporaryHitPoints !== undefined) data.temporaryHitPoints = dto.temporaryHitPoints;
    if (dto.armorClass !== undefined) data.armorClass = dto.armorClass;
    if (dto.speed !== undefined) data.speed = dto.speed;
    if (dto.proficiencyBonus !== undefined) data.proficiencyBonus = dto.proficiencyBonus;
    if (dto.savingThrows !== undefined) {
      data.savingThrows = dto.savingThrows as Prisma.InputJsonValue;
    }
    if (dto.skills !== undefined) data.skills = dto.skills as Prisma.InputJsonValue;
    if (dto.featuresAndTraits !== undefined) {
      data.featuresAndTraits = dto.featuresAndTraits as Prisma.InputJsonValue;
    }
    if (dto.equipment !== undefined) data.equipment = dto.equipment as Prisma.InputJsonValue;
    if (dto.spellSlots !== undefined) {
      data.spellSlots = dto.spellSlots as Prisma.InputJsonValue;
    }
    if (dto.knownSpells !== undefined) {
      data.knownSpells = dto.knownSpells as Prisma.InputJsonValue;
    }
    if (dto.deathSaves !== undefined) {
      data.deathSaves = dto.deathSaves as Prisma.InputJsonValue;
    }
    if (dto.conditions !== undefined) {
      data.conditions = dto.conditions as Prisma.InputJsonValue;
    }
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.portraitUrl !== undefined) data.portraitUrl = dto.portraitUrl;
    return data;
  }

  private validateHomebrewData(
    type: HomebrewType,
    data: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    const schema = getHomebrewDataSchema(type as SharedHomebrewType);
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Invalid data for this homebrew type',
        details: parsed.error.issues.map((issue: ZodIssue) => ({
          field: `data.${issue.path.join('.')}`,
          issue: issue.message,
        })),
      });
    }
    return parsed.data as Prisma.InputJsonValue;
  }

  private paginate<T, R>(items: T[], limit: number, mapFn: (item: T) => R) {
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      data: page.map(mapFn),
      nextCursor: hasMore ? (page[page.length - 1] as { id: string }).id : null,
      hasMore,
    };
  }
}
