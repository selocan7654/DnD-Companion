import { Module } from '@nestjs/common';

import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { DmNotesController } from './dm-notes/dm-notes.controller';
import { DmNotesService } from './dm-notes/dm-notes.service';
import { InviteController } from './invite.controller';

@Module({
  controllers: [CampaignsController, InviteController, DmNotesController],
  providers: [CampaignsService, DmNotesService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
