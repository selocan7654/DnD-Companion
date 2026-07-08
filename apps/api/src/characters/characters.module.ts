import { Module } from '@nestjs/common';

import { WebsocketModule } from '../websocket/websocket.module';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';

@Module({
  imports: [WebsocketModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
