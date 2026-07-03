import { Source } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

export class ReferenceListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(Source)
  source?: Source;

  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sort?: 'name' | 'createdAt';
}

export class SpellListQueryDto extends ReferenceListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9)
  level?: number;

  @IsOptional()
  @IsString()
  school?: string;

  @IsOptional()
  @IsString()
  class?: string;
}

export class MonsterListQueryDto extends ReferenceListQueryDto {
  @IsOptional()
  @IsString()
  challengeRating?: string;

  @IsOptional()
  @IsString()
  creatureType?: string;

  @IsOptional()
  @IsString()
  size?: string;
}

export class SubclassListQueryDto extends ReferenceListQueryDto {
  @IsOptional()
  @IsString()
  parentClass?: string;
}

export class MagicItemListQueryDto extends ReferenceListQueryDto {
  @IsOptional()
  @IsString()
  rarity?: string;
}
