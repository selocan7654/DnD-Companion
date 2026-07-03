import { ConflictException } from '@nestjs/common';

export class AlreadyAssignedToCampaignException extends ConflictException {
  constructor() {
    super({
      error: 'ALREADY_ASSIGNED_TO_CAMPAIGN',
      message: 'Character is already assigned to a campaign. Unassign first.',
    });
  }
}
