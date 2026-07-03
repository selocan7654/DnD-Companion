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
import { CreateHomebrewDto } from './dto/create-homebrew.dto';
import { HomebrewGalleryQueryDto, MyCreationsQueryDto } from './dto/homebrew-list-query.dto';
import { UpdateHomebrewDto } from './dto/update-homebrew.dto';
import { HomebrewService } from './homebrew.service';

@Controller('homebrew')
export class HomebrewController {
  constructor(private readonly homebrewService: HomebrewService) {}

  @Post()
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHomebrewDto) {
    return this.homebrewService.create(user, dto);
  }

  @Get()
  @Public()
  findGallery(@Query() query: HomebrewGalleryQueryDto) {
    return this.homebrewService.findGallery(query);
  }

  @Get('my-creations')
  @RequireVerifiedEmail()
  findMyCreations(@CurrentUser() user: AuthUser, @Query() query: MyCreationsQueryDto) {
    return this.homebrewService.findMyCreations(user, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: AuthUser) {
    return this.homebrewService.findOne(id, user ?? null);
  }

  @Patch(':id')
  @RequireVerifiedEmail()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomebrewDto,
  ) {
    return this.homebrewService.update(id, user, dto);
  }

  @Delete(':id')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.homebrewService.remove(id, user);
  }

  @Patch(':id/publish')
  @RequireVerifiedEmail()
  publish(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.homebrewService.publish(id, user);
  }

  @Patch(':id/unpublish')
  @RequireVerifiedEmail()
  unpublish(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.homebrewService.unpublish(id, user);
  }
}
