import { HomebrewType } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateHomebrewDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(HomebrewType)
  type!: HomebrewType;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ require_protocol: true })
  imageUrl?: string | null;

  @IsObject()
  data!: Record<string, unknown>;
}
