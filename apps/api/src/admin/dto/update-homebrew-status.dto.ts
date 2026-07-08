import { IsEnum } from 'class-validator';
import { HomebrewStatus } from '@prisma/client';

export class UpdateHomebrewStatusDto {
  @IsEnum(HomebrewStatus)
  status!: HomebrewStatus;
}
