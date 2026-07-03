import { Module } from '@nestjs/common';

import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { InviteController } from './invite.controller';

@Module({
  controllers: [CampaignsController, InviteController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
