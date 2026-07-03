import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderDmNotesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  noteIds!: string[];
}
