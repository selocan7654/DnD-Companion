import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  race?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  className?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subclass?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  level?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  background?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alignment?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experiencePoints?: number;

  @IsOptional()
  @IsObject()
  abilityScores?: Record<string, number>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hitPointsMax?: number | null;

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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  armorClass?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  speed?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  proficiencyBonus?: number | null;

  @IsOptional()
  @IsObject()
  savingThrows?: Record<string, boolean> | null;

  @IsOptional()
  @IsObject()
  skills?: Record<string, unknown> | null;

  @IsOptional()
  featuresAndTraits?: unknown[] | null;

  @IsOptional()
  equipment?: unknown[] | null;

  @IsOptional()
  @IsObject()
  spellSlots?: Record<string, unknown> | null;

  @IsOptional()
  knownSpells?: unknown[] | null;

  @IsOptional()
  @IsObject()
  deathSaves?: { successes: number; failures: number };

  @IsOptional()
  conditions?: string[];

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portraitUrl?: string | null;
}
