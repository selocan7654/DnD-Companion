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
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateCampaignDto } from '../campaigns/dto/update-campaign.dto';
import { UpdateCharacterDto } from '../characters/dto/update-character.dto';
import { UpdateHomebrewDto } from '../homebrew/dto/update-homebrew.dto';
import { AdminService } from './admin.service';
import { AdminCampaignListQueryDto } from './dto/admin-campaign-list-query.dto';
import { AdminCharacterListQueryDto } from './dto/admin-character-list-query.dto';
import { AdminHomebrewListQueryDto } from './dto/admin-homebrew-list-query.dto';
import { UpdateHomebrewStatusDto } from './dto/update-homebrew-status.dto';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminContentController {
  constructor(private readonly adminService: AdminService) {}

  // ── Campaigns ──────────────────────────────────────────────────────────

  @Get('campaigns')
  listCampaigns(@Query() query: AdminCampaignListQueryDto) {
    return this.adminService.listCampaigns(query);
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCampaign(id);
  }

  @Patch('campaigns/:id')
  updateCampaign(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.adminService.updateCampaign(user.id, id, dto);
  }

  @Delete('campaigns/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCampaign(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteCampaign(user.id, id);
  }

  // ── Characters ─────────────────────────────────────────────────────────

  @Get('characters')
  listCharacters(@Query() query: AdminCharacterListQueryDto) {
    return this.adminService.listCharacters(query);
  }

  @Get('characters/:id')
  getCharacter(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCharacter(id);
  }

  @Patch('characters/:id')
  updateCharacter(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.adminService.updateCharacter(user.id, id, dto);
  }

  @Delete('characters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCharacter(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteCharacter(user.id, id);
  }

  // ── Homebrew ───────────────────────────────────────────────────────────

  @Get('homebrew')
  listHomebrew(@Query() query: AdminHomebrewListQueryDto) {
    return this.adminService.listHomebrew(query);
  }

  @Get('homebrew/:id')
  getHomebrew(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getHomebrew(id);
  }

  @Patch('homebrew/:id')
  updateHomebrew(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomebrewDto,
  ) {
    return this.adminService.updateHomebrew(user.id, id, dto);
  }

  @Delete('homebrew/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHomebrew(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteHomebrew(user.id, id);
  }

  @Patch('homebrew/:id/status')
  updateHomebrewStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomebrewStatusDto,
  ) {
    return this.adminService.updateHomebrewStatus(user.id, id, dto);
  }
}
