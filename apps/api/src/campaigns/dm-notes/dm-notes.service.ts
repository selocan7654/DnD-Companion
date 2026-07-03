import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { DmNotePolicy } from '../../common/policies/dm-note.policy';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDmNoteDto } from './dto/create-dm-note.dto';
import { ReorderDmNotesDto } from './dto/reorder-dm-notes.dto';
import { UpdateDmNoteDto } from './dto/update-dm-note.dto';

@Injectable()
export class DmNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(campaignId: string, user: AuthUser) {
    const campaign = await this.findCampaignOrFail(campaignId, user);
    const notes = await this.prisma.dmNote.findMany({
      where: { campaignId: campaign.id },
      orderBy: { sortOrder: 'asc' },
    });

    return { data: notes };
  }

  async create(campaignId: string, user: AuthUser, dto: CreateDmNoteDto) {
    const campaign = await this.findCampaignOrFail(campaignId, user, 'write');

    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const aggregate = await this.prisma.dmNote.aggregate({
        where: { campaignId: campaign.id },
        _max: { sortOrder: true },
      });
      sortOrder = (aggregate._max.sortOrder ?? -1) + 1;
    }

    const note = await this.prisma.dmNote.create({
      data: {
        campaignId: campaign.id,
        title: dto.title,
        content: dto.content ?? null,
        sortOrder,
      },
    });

    return { data: note };
  }

  async update(campaignId: string, noteId: string, user: AuthUser, dto: UpdateDmNoteDto) {
    const campaign = await this.findCampaignOrFail(campaignId, user, 'write');
    const note = await this.findNoteInCampaignOrFail(campaign.id, noteId);

    const updated = await this.prisma.dmNote.update({
      where: { id: note.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
      },
    });

    return { data: updated };
  }

  async remove(campaignId: string, noteId: string, user: AuthUser) {
    const campaign = await this.findCampaignOrFail(campaignId, user, 'write');
    const note = await this.findNoteInCampaignOrFail(campaign.id, noteId);

    await this.prisma.dmNote.delete({ where: { id: note.id } });
  }

  async reorder(campaignId: string, user: AuthUser, dto: ReorderDmNotesDto) {
    const campaign = await this.findCampaignOrFail(campaignId, user, 'write');

    const existingNotes = await this.prisma.dmNote.findMany({
      where: { campaignId: campaign.id },
      select: { id: true },
      orderBy: { sortOrder: 'asc' },
    });

    const existingIds = new Set(existingNotes.map((note) => note.id));
    const providedIds = new Set(dto.noteIds);

    if (existingIds.size !== providedIds.size || dto.noteIds.some((id) => !existingIds.has(id))) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'noteIds must contain exactly all notes for this campaign',
      });
    }

    await this.prisma.$transaction(
      dto.noteIds.map((id, index) =>
        this.prisma.dmNote.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    const notes = await this.prisma.dmNote.findMany({
      where: { campaignId: campaign.id },
      orderBy: { sortOrder: 'asc' },
    });

    return { data: notes };
  }

  private async findCampaignOrFail(
    campaignId: string,
    user: AuthUser,
    action: 'read' | 'write' = 'read',
  ): Promise<{ id: string; ownerId: string }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, ownerId: true },
    });

    if (!campaign) {
      throw new NotFoundException();
    }

    const canAccess =
      action === 'write'
        ? DmNotePolicy.canWrite(user, campaign)
        : DmNotePolicy.canRead(user, campaign);

    if (!canAccess) {
      throw new NotFoundException();
    }

    return campaign;
  }

  private async findNoteInCampaignOrFail(campaignId: string, noteId: string) {
    const note = await this.prisma.dmNote.findFirst({
      where: { id: noteId, campaignId },
    });

    if (!note) {
      throw new NotFoundException();
    }

    return note;
  }
}
