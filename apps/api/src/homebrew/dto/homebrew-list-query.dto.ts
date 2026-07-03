import { HomebrewStatus, HomebrewType, Source } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

export class HomebrewGalleryQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(HomebrewType)
  type?: HomebrewType;

  @IsOptional()
  @IsEnum(Source)
  source?: Source;

  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sort?: 'name' | 'createdAt';
}

export class MyCreationsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(HomebrewType)
  type?: HomebrewType;

  @IsOptional()
  @IsEnum(HomebrewStatus)
  status?: HomebrewStatus;
}
