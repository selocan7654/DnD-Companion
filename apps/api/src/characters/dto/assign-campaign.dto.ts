import { IsUUID, ValidateIf } from 'class-validator';

export class AssignCampaignDto {
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  campaignId!: string | null;
}
