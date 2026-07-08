import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(USERNAME_REGEX, {
    message: 'Username may only contain letters, numbers, hyphens, and underscores',
  })
  username?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string | null;
}
