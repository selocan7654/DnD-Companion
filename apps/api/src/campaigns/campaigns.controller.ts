import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Body,
  Query,
} from '@nestjs/common';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator';
import { CampaignsService } from './campaigns.service';
import { CampaignListQueryDto } from './dto/campaign-list-query.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: CampaignListQueryDto) {
    return this.campaignsService.findAll(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.findOne(id, user);
  }

  @Patch(':id')
  @RequireVerifiedEmail()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, user, dto);
  }

  @Delete(':id')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.campaignsService.remove(id, user);
  }

  @Post(':id/invite/regenerate')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.OK)
  regenerateInvite(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.regenerateInvite(id, user);
  }

  @Post(':id/invite/disable')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.NO_CONTENT)
  async disableInvite(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.campaignsService.disableInvite(id, user);
  }

  @Get(':id/members')
  listMembers(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.listMembers(id, user);
  }

  @Delete(':id/members/:userId')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.campaignsService.removeMember(id, userId, user);
  }
}
