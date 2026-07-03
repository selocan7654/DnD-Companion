import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator';
import { CollectionsService } from './collections.service';
import { CollectionListQueryDto } from './dto/collection-list-query.dto';

@Controller('collections')
@RequireVerifiedEmail()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: CollectionListQueryDto) {
    return this.collectionsService.findAll(user, query);
  }

  @Post(':homebrewItemId')
  @HttpCode(HttpStatus.CREATED)
  add(
    @CurrentUser() user: AuthUser,
    @Param('homebrewItemId', ParseUUIDPipe) homebrewItemId: string,
  ) {
    return this.collectionsService.add(user, homebrewItemId);
  }

  @Delete(':homebrewItemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('homebrewItemId', ParseUUIDPipe) homebrewItemId: string,
  ) {
    await this.collectionsService.remove(user, homebrewItemId);
  }
}
