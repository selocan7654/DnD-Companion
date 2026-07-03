import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Character, Prisma } from '@prisma/client';
import { updateCharacterSchema } from '@dnd-companion/shared';
import type { ZodIssue } from 'zod';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AlreadyAssignedToCampaignException } from '../common/exceptions/already-assigned-to-campaign.exception';
import { CampaignPolicy } from '../common/policies/campaign.policy';
import { CharacterPolicy } from '../common/policies/character.policy';
import { PrismaService } from '../common/prisma/prisma.service';
import { AssignCampaignDto } from './dto/assign-campaign.dto';
import { CharacterListQueryDto } from './dto/character-list-query.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

const characterInclude = {
  owner: { select: { username: true, avatarUrl: true, isActive: true } },
  campaign: {
    include: {
      members: { select: { userId: true } },
    },
  },
} satisfies Prisma.CharacterInclude;

type CharacterLoaded = Character & {
  owner: { username: string; avatarUrl: string | null; isActive: boolean };
  campaign: {
    id: string;
    ownerId: string;
    members: Array<{ userId: string }>;
  } | null;
};

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateCharacterDto) {
    if (dto.campaignId) {
      await this.assertUserCanJoinCampaign(user, dto.campaignId);
    }

    const character = await this.prisma.character.create({
      data: {
        name: dto.name,
        ownerId: user.id,
        race: dto.race,
        className: dto.className,
        subclass: dto.subclass,
        level: dto.level ?? 1,
        background: dto.background,
        campaignId: dto.campaignId ?? null,
      },
      include: characterInclude,
    });

    return { data: this.toCharacterResponse(character) };
  }

  async findAll(user: AuthUser, query: CharacterListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const search = query.search?.trim();
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';

    const where: Prisma.CharacterWhereInput = {
      ownerId: user.id,
      ...(query.campaignId !== undefined ? { campaignId: query.campaignId } : {}),
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' as const },
          }
        : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.character.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      include: characterInclude,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
      data: page.map((character) => this.toCharacterResponse(character)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
      hasMore,
    };
  }

  async findOne(id: string, user: AuthUser | null) {
    const character = await this.loadCharacter(id);
    if (!character || !CharacterPolicy.canRead(user, character)) {
      throw new NotFoundException();
    }

    return { data: this.toCharacterResponse(character) };
  }

  async update(id: string, user: AuthUser, dto: UpdateCharacterDto) {
    const character = await this.loadCharacter(id);
    if (!character || !CharacterPolicy.canRead(user, character)) {
      throw new NotFoundException();
    }

    if (!CharacterPolicy.canUpdate(user, character)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to update this character',
      });
    }

    const parsed = updateCharacterSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Invalid character data',
        details: parsed.error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.'),
          issue: issue.message,
        })),
      });
    }

    const data = this.buildUpdateData(parsed.data);
    const updated = await this.prisma.character.update({
      where: { id },
      data,
      include: characterInclude,
    });

    return { data: this.toCharacterResponse(updated) };
  }

  async remove(id: string, user: AuthUser) {
    const character = await this.loadCharacter(id);
    if (!character || !CharacterPolicy.canRead(user, character)) {
      throw new NotFoundException();
    }

    if (!CharacterPolicy.canDelete(user, character)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to delete this character',
      });
    }

    await this.prisma.character.delete({ where: { id } });
  }

  async assignCampaign(id: string, user: AuthUser, dto: AssignCampaignDto) {
    const character = await this.loadCharacter(id);
    if (!character || !CharacterPolicy.canRead(user, character)) {
      throw new NotFoundException();
    }

    if (!CharacterPolicy.canAssignCampaign(user, character)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to assign this character to a campaign',
      });
    }

    if (dto.campaignId === null) {
      const updated = await this.prisma.character.update({
        where: { id },
        data: { campaignId: null },
        include: characterInclude,
      });
      return { data: this.toCharacterResponse(updated) };
    }

    if (character.campaignId !== null && character.campaignId !== dto.campaignId) {
      throw new AlreadyAssignedToCampaignException();
    }

    await this.assertUserCanJoinCampaign(user, dto.campaignId);

    const updated = await this.prisma.character.update({
      where: { id },
      data: { campaignId: dto.campaignId },
      include: characterInclude,
    });

    return { data: this.toCharacterResponse(updated) };
  }

  async setVisibility(id: string, user: AuthUser, dto: SetVisibilityDto) {
    const character = await this.loadCharacter(id);
    if (!character || !CharacterPolicy.canRead(user, character)) {
      throw new NotFoundException();
    }

    if (!CharacterPolicy.canChangeVisibility(user, character)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to change visibility for this character',
      });
    }

    const updated = await this.prisma.character.update({
      where: { id },
      data: { visibility: dto.visibility },
      include: characterInclude,
    });

    return { data: this.toCharacterResponse(updated) };
  }

  private async loadCharacter(id: string): Promise<CharacterLoaded | null> {
    return this.prisma.character.findUnique({
      where: { id },
      include: characterInclude,
    });
  }

  private async assertUserCanJoinCampaign(user: AuthUser, campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { members: { select: { userId: true } } },
    });

    if (!campaign || !CampaignPolicy.canRead(user, campaign)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You are not a member of this campaign',
      });
    }
  }

  private buildUpdateData(
    parsed: ReturnType<typeof updateCharacterSchema.parse>,
  ): Prisma.CharacterUpdateInput {
    const data: Prisma.CharacterUpdateInput = {};

    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.race !== undefined) data.race = parsed.race;
    if (parsed.className !== undefined) data.className = parsed.className;
    if (parsed.subclass !== undefined) data.subclass = parsed.subclass;
    if (parsed.level !== undefined) data.level = parsed.level;
    if (parsed.background !== undefined) data.background = parsed.background;
    if (parsed.alignment !== undefined) data.alignment = parsed.alignment;
    if (parsed.experiencePoints !== undefined) data.experiencePoints = parsed.experiencePoints;
    if (parsed.abilityScores !== undefined) {
      data.abilityScores = parsed.abilityScores as Prisma.InputJsonValue;
    }
    if (parsed.hitPointsMax !== undefined) data.hitPointsMax = parsed.hitPointsMax;
    if (parsed.hitPointsCurrent !== undefined) data.hitPointsCurrent = parsed.hitPointsCurrent;
    if (parsed.temporaryHitPoints !== undefined)
      data.temporaryHitPoints = parsed.temporaryHitPoints;
    if (parsed.armorClass !== undefined) data.armorClass = parsed.armorClass;
    if (parsed.speed !== undefined) data.speed = parsed.speed;
    if (parsed.proficiencyBonus !== undefined) data.proficiencyBonus = parsed.proficiencyBonus;
    if (parsed.savingThrows !== undefined) {
      data.savingThrows = parsed.savingThrows as Prisma.InputJsonValue;
    }
    if (parsed.skills !== undefined) data.skills = parsed.skills as Prisma.InputJsonValue;
    if (parsed.featuresAndTraits !== undefined) {
      data.featuresAndTraits = parsed.featuresAndTraits as Prisma.InputJsonValue;
    }
    if (parsed.equipment !== undefined) data.equipment = parsed.equipment as Prisma.InputJsonValue;
    if (parsed.spellSlots !== undefined)
      data.spellSlots = parsed.spellSlots as Prisma.InputJsonValue;
    if (parsed.knownSpells !== undefined) {
      data.knownSpells = parsed.knownSpells as Prisma.InputJsonValue;
    }
    if (parsed.deathSaves !== undefined)
      data.deathSaves = parsed.deathSaves as Prisma.InputJsonValue;
    if (parsed.conditions !== undefined)
      data.conditions = parsed.conditions as Prisma.InputJsonValue;
    if (parsed.notes !== undefined) data.notes = parsed.notes;
    if (parsed.portraitUrl !== undefined) data.portraitUrl = parsed.portraitUrl;

    return data;
  }

  private toCharacterResponse(character: CharacterLoaded) {
    return {
      id: character.id,
      ownerId: character.ownerId,
      ownerUsername: character.owner.username,
      ownerAvatarUrl: character.owner.avatarUrl,
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
}
