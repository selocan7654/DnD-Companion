import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireVerifiedEmail } from '../../common/decorators/require-verified-email.decorator';
import { CreateDmNoteDto } from './dto/create-dm-note.dto';
import { ReorderDmNotesDto } from './dto/reorder-dm-notes.dto';
import { UpdateDmNoteDto } from './dto/update-dm-note.dto';
import { DmNotesService } from './dm-notes.service';

@Controller('campaigns/:campaignId/dm-notes')
export class DmNotesController {
  constructor(private readonly dmNotesService: DmNotesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('campaignId', ParseUUIDPipe) campaignId: string) {
    return this.dmNotesService.list(campaignId, user);
  }

  @Post()
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: CreateDmNoteDto,
  ) {
    return this.dmNotesService.create(campaignId, user, dto);
  }

  @Patch('reorder')
  @RequireVerifiedEmail()
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: ReorderDmNotesDto,
  ) {
    return this.dmNotesService.reorder(campaignId, user, dto);
  }

  @Patch(':noteId')
  @RequireVerifiedEmail()
  update(
    @CurrentUser() user: AuthUser,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateDmNoteDto,
  ) {
    return this.dmNotesService.update(campaignId, noteId, user, dto);
  }

  @Delete(':noteId')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    await this.dmNotesService.remove(campaignId, noteId, user);
  }
}
