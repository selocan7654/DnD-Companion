import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HomebrewItem, HomebrewStatus, HomebrewType, Prisma, Source } from '@prisma/client';
import { getHomebrewDataSchema, HomebrewType as SharedHomebrewType } from '@dnd-companion/shared';
import type { ZodIssue } from 'zod';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { HomebrewPolicy } from '../common/policies/homebrew.policy';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateHomebrewDto } from './dto/create-homebrew.dto';
import { HomebrewGalleryQueryDto, MyCreationsQueryDto } from './dto/homebrew-list-query.dto';
import { UpdateHomebrewDto } from './dto/update-homebrew.dto';

const homebrewInclude = {
  owner: { select: { username: true, isActive: true } },
} satisfies Prisma.HomebrewItemInclude;

type HomebrewLoaded = HomebrewItem & {
  owner: { username: string; isActive: boolean } | null;
};

@Injectable()
export class HomebrewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateHomebrewDto) {
    const parsedData = this.validateData(dto.type, dto.data);

    const item = await this.prisma.homebrewItem.create({
      data: {
        name: dto.name,
        type: dto.type,
        source: Source.HOMEBREW,
        ownerId: user.id,
        status: HomebrewStatus.DRAFT,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        data: parsedData,
      },
      include: homebrewInclude,
    });

    return { data: this.toFullResponse(item) };
  }

  async findGallery(query: HomebrewGalleryQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const search = query.search?.trim();
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';

    const where: Prisma.HomebrewItemWhereInput = {
      status: HomebrewStatus.PUBLISHED,
      // Official (null owner) stays visible; homebrew requires active owner ([AP-002]).
      OR: [{ ownerId: null }, { owner: { isActive: true } }],
      ...(query.type ? { type: query.type } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' as const },
          }
        : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.homebrewItem.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortOrder },
      include: homebrewInclude,
    });

    return this.paginate(items, limit);
  }

  async findMyCreations(user: AuthUser, query: MyCreationsQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const search = query.search?.trim();
    const sortOrder = query.order ?? 'desc';

    const where: Prisma.HomebrewItemWhereInput = {
      source: Source.HOMEBREW,
      ownerId: user.id,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' as const },
          }
        : {}),
      ...(query.cursor
        ? { id: sortOrder === 'desc' ? { lt: query.cursor } : { gt: query.cursor } }
        : {}),
    };

    const items = await this.prisma.homebrewItem.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: sortOrder },
      include: homebrewInclude,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
      data: page.map((item) => this.toFullResponse(item)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: string, user: AuthUser | null) {
    const item = await this.loadItem(id);
    if (!HomebrewPolicy.canRead(user, item)) {
      throw new NotFoundException();
    }

    return { data: this.toFullResponse(item) };
  }

  async update(id: string, user: AuthUser, dto: UpdateHomebrewDto) {
    const item = await this.loadItem(id);
    if (!HomebrewPolicy.canRead(user, item)) {
      throw new NotFoundException();
    }
    if (!HomebrewPolicy.canUpdate(user, item)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to update this homebrew item',
      });
    }

    let parsedData: Prisma.InputJsonValue | undefined;
    if (dto.data !== undefined) {
      parsedData = this.validateData(item.type, dto.data);
    }

    const updated = await this.prisma.homebrewItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(parsedData !== undefined ? { data: parsedData } : {}),
      },
      include: homebrewInclude,
    });

    return { data: this.toFullResponse(updated) };
  }

  async remove(id: string, user: AuthUser) {
    const item = await this.loadItem(id);
    if (!HomebrewPolicy.canRead(user, item)) {
      throw new NotFoundException();
    }
    if (!HomebrewPolicy.canDelete(user, item)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to delete this homebrew item',
      });
    }

    await this.prisma.homebrewItem.delete({ where: { id } });
  }

  async publish(id: string, user: AuthUser) {
    const item = await this.loadItem(id);
    if (!HomebrewPolicy.canRead(user, item)) {
      throw new NotFoundException();
    }
    if (!HomebrewPolicy.canPublish(user, item)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to publish this homebrew item',
      });
    }

    if (item.status === HomebrewStatus.PUBLISHED) {
      throw new UnprocessableEntityException({
        error: 'ALREADY_PUBLISHED',
        message: 'This homebrew item is already published',
      });
    }

    const updated = await this.prisma.homebrewItem.update({
      where: { id },
      data: {
        status: HomebrewStatus.PUBLISHED,
        publishedAt: item.publishedAt ?? new Date(),
      },
      include: homebrewInclude,
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
        publishedAt: updated.publishedAt,
      },
    };
  }

  async unpublish(id: string, user: AuthUser) {
    const item = await this.loadItem(id);
    if (!HomebrewPolicy.canRead(user, item)) {
      throw new NotFoundException();
    }
    if (!HomebrewPolicy.canUnpublish(user, item)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to unpublish this homebrew item',
      });
    }

    if (item.status === HomebrewStatus.DRAFT) {
      throw new UnprocessableEntityException({
        error: 'ALREADY_DRAFT',
        message: 'This homebrew item is already a draft',
      });
    }

    const updated = await this.prisma.homebrewItem.update({
      where: { id },
      data: { status: HomebrewStatus.DRAFT },
      include: homebrewInclude,
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }

  private async loadItem(id: string): Promise<HomebrewLoaded> {
    const item = await this.prisma.homebrewItem.findUnique({
      where: { id },
      include: homebrewInclude,
    });
    if (!item) {
      throw new NotFoundException();
    }
    return item;
  }

  private validateData(type: HomebrewType, data: Record<string, unknown>): Prisma.InputJsonValue {
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

  private paginate(items: HomebrewLoaded[], limit: number) {
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    return {
      data: page.map((item) => this.toGalleryResponse(item)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    };
  }

  private toGalleryResponse(item: HomebrewLoaded) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      source: item.source,
      status: item.status,
      description: item.description,
      imageUrl: item.imageUrl,
      ownerUsername: item.source === Source.HOMEBREW ? (item.owner?.username ?? null) : null,
      createdAt: item.createdAt,
    };
  }

  private toFullResponse(item: HomebrewLoaded) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      source: item.source,
      status: item.status,
      description: item.description,
      imageUrl: item.imageUrl,
      data: item.data,
      ownerId: item.ownerId,
      ownerUsername: item.source === Source.HOMEBREW ? (item.owner?.username ?? null) : null,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
