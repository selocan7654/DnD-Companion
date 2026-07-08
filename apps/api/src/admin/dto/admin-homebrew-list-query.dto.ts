import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { HomebrewStatus, HomebrewType, Source } from '@prisma/client';

import { ListQueryDto } from '../../common/dto/list-query.dto';

export class AdminHomebrewListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(HomebrewType)
  type?: HomebrewType;

  @IsOptional()
  @IsEnum(HomebrewStatus)
  status?: HomebrewStatus;

  @IsOptional()
  @IsEnum(Source)
  source?: Source;

  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sort?: 'name' | 'createdAt';
}
