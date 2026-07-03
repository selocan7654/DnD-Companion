import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { Public } from '../common/decorators/public.decorator';
import {
  MagicItemListQueryDto,
  MonsterListQueryDto,
  ReferenceListQueryDto,
  SpellListQueryDto,
  SubclassListQueryDto,
} from './dto/reference-list-query.dto';
import { ReferenceService } from './reference.service';

@Controller('reference')
@Public()
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get('spells')
  findSpells(@Query() query: SpellListQueryDto) {
    return this.referenceService.findSpells(query);
  }

  @Get('spells/:id')
  findSpell(@Param('id', ParseUUIDPipe) id: string) {
    return this.referenceService.findSpell(id);
  }

  @Get('monsters')
  findMonsters(@Query() query: MonsterListQueryDto) {
    return this.referenceService.findMonsters(query);
  }

  @Get('monsters/:id')
  findMonster(@Param('id', ParseUUIDPipe) id: string) {
    return this.referenceService.findMonster(id);
  }

  @Get('feats')
  findFeats(@Query() query: ReferenceListQueryDto) {
    return this.referenceService.findFeats(query);
  }

  @Get('feats/:id')
  findFeat(@Param('id', ParseUUIDPipe) id: string) {
    return this.referenceService.findFeat(id);
  }

  @Get('backgrounds')
  findBackgrounds(@Query() query: ReferenceListQueryDto) {
    return this.referenceService.findBackgrounds(query);
  }

  @Get('backgrounds/:id')
  findBackground(@Param('id', ParseUUIDPipe) id: string) {
    return this.referenceService.findBackground(id);
  }

  @Get('magic-items')
  findMagicItems(@Query() query: MagicItemListQueryDto) {
    return this.referenceService.findMagicItems(query);
  }

  @Get('magic-items/:id')
  findMagicItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.referenceService.findMagicItem(id);
  }

  @Get('subclasses')
  findSubclasses(@Query() query: SubclassListQueryDto) {
    return this.referenceService.findSubclasses(query);
  }

  @Get('subclasses/:id')
  findSubclass(@Param('id', ParseUUIDPipe) id: string) {
    return this.referenceService.findSubclass(id);
  }

  @Get('classes')
  findClasses() {
    return this.referenceService.findClasses();
  }

  @Get('races')
  findRaces() {
    return this.referenceService.findRaces();
  }
}
