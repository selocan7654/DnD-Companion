import { IsEmail } from 'class-validator';

export class DevVerificationTokenQueryDto {
  @IsEmail()
  email!: string;
}
