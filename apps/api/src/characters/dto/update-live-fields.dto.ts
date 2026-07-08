import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class DeathSavesDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  successes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  failures!: number;
}

export class UpdateLiveFieldsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hitPointsCurrent?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  temporaryHitPoints?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeathSavesDto)
  deathSaves?: DeathSavesDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  conditions?: string[];
}
