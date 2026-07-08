import { IsIn, IsOptional } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

export class AdminCharacterListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(['name', 'createdAt', 'level'])
  sort?: 'name' | 'createdAt' | 'level';
}
