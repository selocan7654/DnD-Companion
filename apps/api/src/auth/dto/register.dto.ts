import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(USERNAME_REGEX, {
    message: 'Username may only contain letters, numbers, hyphens, and underscores',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
