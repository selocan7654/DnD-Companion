import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDmNoteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;
}
