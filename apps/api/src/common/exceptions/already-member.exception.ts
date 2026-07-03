import { ConflictException } from '@nestjs/common';

export class AlreadyMemberException extends ConflictException {
  constructor() {
    super({
      error: 'ALREADY_MEMBER',
      message: 'User is already a member of this campaign',
    });
  }
}
