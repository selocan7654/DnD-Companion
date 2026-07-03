import { CharacterVisibility } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetVisibilityDto {
  @IsEnum(CharacterVisibility)
  visibility!: CharacterVisibility;
}
