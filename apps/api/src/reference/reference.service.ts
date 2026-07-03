import { Injectable, NotFoundException } from '@nestjs/common';
import { DND_CLASSES, DND_RACES } from '@dnd-companion/shared';
import { HomebrewStatus, HomebrewType, Prisma, Source } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import {
  MagicItemListQueryDto,
  MonsterListQueryDto,
  ReferenceListQueryDto,
  SpellListQueryDto,
  SubclassListQueryDto,
} from './dto/reference-list-query.dto';

type ReferenceItem = Prisma.HomebrewItemGetPayload<object>;

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  findClasses() {
    return { data: DND_CLASSES };
  }

  findRaces() {
    return { data: DND_RACES };
  }

  findSpells(query: SpellListQueryDto) {
    return this.findByType(HomebrewType.SPELL, query, (q) => {
      const filters: Prisma.HomebrewItemWhereInput[] = [];

      if (q.level !== undefined) {
        filters.push({ data: { path: ['level'], equals: q.level } });
      }
      if (q.school?.trim()) {
        filters.push({
          data: { path: ['school'], string_contains: q.school.trim(), mode: 'insensitive' },
        });
      }
      if (q.class?.trim()) {
        filters.push({ data: { path: ['classes'], array_contains: q.class.trim() } });
      }

      return filters;
    });
  }

  findMonsters(query: MonsterListQueryDto) {
    return this.findByType(HomebrewType.MONSTER, query, (q) => {
      const filters: Prisma.HomebrewItemWhereInput[] = [];

      if (q.challengeRating?.trim()) {
        filters.push({
          data: {
            path: ['challenge_rating'],
            string_contains: q.challengeRating.trim(),
            mode: 'insensitive',
          },
        });
      }
      if (q.creatureType?.trim()) {
        filters.push({
          data: {
            path: ['creature_type'],
            string_contains: q.creatureType.trim(),
            mode: 'insensitive',
          },
        });
      }
      if (q.size?.trim()) {
        filters.push({
          data: { path: ['size'], string_contains: q.size.trim(), mode: 'insensitive' },
        });
      }

      return filters;
    });
  }

  findFeats(query: ReferenceListQueryDto) {
    return this.findByType(HomebrewType.FEAT, query);
  }

  findBackgrounds(query: ReferenceListQueryDto) {
    return this.findByType(HomebrewType.BACKGROUND, query);
  }

  findMagicItems(query: MagicItemListQueryDto) {
    return this.findByType(HomebrewType.MAGIC_ITEM, query, (q) => {
      const filters: Prisma.HomebrewItemWhereInput[] = [];

      if (q.rarity?.trim()) {
        filters.push({
          data: { path: ['rarity'], string_contains: q.rarity.trim(), mode: 'insensitive' },
        });
      }

      return filters;
    });
  }

  findSubclasses(query: SubclassListQueryDto) {
    return this.findByType(HomebrewType.SUBCLASS, query, (q) => {
      const filters: Prisma.HomebrewItemWhereInput[] = [];

      if (q.parentClass?.trim()) {
        filters.push({
          data: {
            path: ['parent_class'],
            string_contains: q.parentClass.trim(),
            mode: 'insensitive',
          },
        });
      }

      return filters;
    });
  }

  async findSpell(id: string) {
    return this.findOne(id, HomebrewType.SPELL);
  }

  async findMonster(id: string) {
    return this.findOne(id, HomebrewType.MONSTER);
  }

  async findFeat(id: string) {
    return this.findOne(id, HomebrewType.FEAT);
  }

  async findBackground(id: string) {
    return this.findOne(id, HomebrewType.BACKGROUND);
  }

  async findMagicItem(id: string) {
    return this.findOne(id, HomebrewType.MAGIC_ITEM);
  }

  async findSubclass(id: string) {
    return this.findOne(id, HomebrewType.SUBCLASS);
  }

  private async findByType<T extends ReferenceListQueryDto>(
    type: HomebrewType,
    query: T,
    extraFilters?: (query: T) => Prisma.HomebrewItemWhereInput[],
  ) {
    const limit = Math.min(query.limit ?? 20, 50);
    const search = query.search?.trim();
    const sortField = query.sort ?? 'name';
    const sortOrder = query.order ?? 'asc';

    const where: Prisma.HomebrewItemWhereInput = {
      type,
      status: HomebrewStatus.PUBLISHED,
      AND: [
        { source: { not: Source.HOMEBREW } },
        ...(query.source ? [{ source: query.source }] : []),
        ...(extraFilters ? extraFilters(query) : []),
      ],
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.homebrewItem.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
      data: page.map((item) => this.toListResponse(item)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    };
  }

  private async findOne(id: string, type: HomebrewType) {
    const item = await this.prisma.homebrewItem.findFirst({
      where: {
        id,
        type,
        source: { not: Source.HOMEBREW },
        status: HomebrewStatus.PUBLISHED,
      },
    });

    if (!item) {
      throw new NotFoundException();
    }

    return { data: this.toDetailResponse(item) };
  }

  private toListResponse(item: ReferenceItem) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      source: item.source,
      description: item.description,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
    };
  }

  private toDetailResponse(item: ReferenceItem) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      source: item.source,
      description: item.description,
      imageUrl: item.imageUrl,
      data: item.data,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
