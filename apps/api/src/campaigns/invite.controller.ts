import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator';
import { CampaignsService } from './campaigns.service';

@Controller('invite')
export class InviteController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get(':token')
  preview(@Param('token') token: string) {
    return this.campaignsService.previewInvite(token);
  }

  @Post(':token/join')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.CREATED)
  join(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.campaignsService.joinCampaign(token, user);
  }
}
