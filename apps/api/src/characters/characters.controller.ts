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
import { Public } from '../common/decorators/public.decorator';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator';
import { CharactersService } from './characters.service';
import { AssignCampaignDto } from './dto/assign-campaign.dto';
import { CharacterListQueryDto } from './dto/character-list-query.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCharacterDto) {
    return this.charactersService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: CharacterListQueryDto) {
    return this.charactersService.findAll(user, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: AuthUser) {
    return this.charactersService.findOne(id, user ?? null);
  }

  @Patch(':id')
  @RequireVerifiedEmail()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, user, dto);
  }

  @Delete(':id')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.charactersService.remove(id, user);
  }

  @Patch(':id/campaign')
  @RequireVerifiedEmail()
  assignCampaign(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCampaignDto,
  ) {
    return this.charactersService.assignCampaign(id, user, dto);
  }

  @Patch(':id/visibility')
  @RequireVerifiedEmail()
  setVisibility(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetVisibilityDto,
  ) {
    return this.charactersService.setVisibility(id, user, dto);
  }
}
