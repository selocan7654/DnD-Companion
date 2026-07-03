import { IsIn, IsOptional, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

export class CharacterListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt', 'level'])
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'level';
}
