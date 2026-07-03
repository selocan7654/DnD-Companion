import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HomebrewStatus, Prisma, Source } from '@prisma/client';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AlreadyInCollectionException } from '../common/exceptions/already-in-collection.exception';
import { CollectionPolicy } from '../common/policies/collection.policy';
import { PrismaService } from '../common/prisma/prisma.service';
import { CollectionListQueryDto } from './dto/collection-list-query.dto';

const collectionInclude = {
  homebrewItem: {
    include: {
      owner: { select: { username: true } },
    },
  },
} satisfies Prisma.CollectionItemInclude;

type CollectionItemLoaded = Prisma.CollectionItemGetPayload<{
  include: typeof collectionInclude;
}>;

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: CollectionListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const search = query.search?.trim();
    const sortOrder = query.order ?? 'desc';

    const homebrewItemWhere: Prisma.HomebrewItemWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const where: Prisma.CollectionItemWhereInput = {
      userId: user.id,
      ...(Object.keys(homebrewItemWhere).length > 0 ? { homebrewItem: homebrewItemWhere } : {}),
      ...(query.cursor
        ? { homebrewItemId: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.collectionItem.findMany({
      where,
      take: limit + 1,
      orderBy: { addedAt: sortOrder },
      include: collectionInclude,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
      data: page.map((item) => this.toListItem(item)),
      nextCursor: hasMore ? page[page.length - 1].homebrewItemId : null,
      hasMore,
    };
  }

  async add(user: AuthUser, homebrewItemId: string) {
    const homebrewItem = await this.prisma.homebrewItem.findUnique({
      where: { id: homebrewItemId },
    });

    if (!homebrewItem || homebrewItem.status !== HomebrewStatus.PUBLISHED) {
      throw new NotFoundException();
    }

    const existing = await this.prisma.collectionItem.findUnique({
      where: {
        userId_homebrewItemId: {
          userId: user.id,
          homebrewItemId,
        },
      },
    });

    if (existing) {
      throw new AlreadyInCollectionException();
    }

    const created = await this.prisma.collectionItem.create({
      data: {
        userId: user.id,
        homebrewItemId,
      },
      include: collectionInclude,
    });

    return { data: this.toListItem(created) };
  }

  async remove(user: AuthUser, homebrewItemId: string) {
    const existing = await this.prisma.collectionItem.findUnique({
      where: {
        userId_homebrewItemId: {
          userId: user.id,
          homebrewItemId,
        },
      },
    });

    if (!existing || !CollectionPolicy.canRemove(user, existing.userId)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'This item is not in your collection',
      });
    }

    await this.prisma.collectionItem.delete({
      where: {
        userId_homebrewItemId: {
          userId: user.id,
          homebrewItemId,
        },
      },
    });
  }

  private toListItem(item: CollectionItemLoaded) {
    const homebrew = item.homebrewItem;

    return {
      homebrewItemId: homebrew.id,
      name: homebrew.name,
      type: homebrew.type,
      source: homebrew.source,
      status: homebrew.status,
      isUnpublished: homebrew.status === HomebrewStatus.DRAFT,
      ownerUsername:
        homebrew.source === Source.HOMEBREW ? (homebrew.owner?.username ?? null) : null,
      addedAt: item.addedAt,
    };
  }
}
