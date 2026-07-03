import { NotFoundException } from '@nestjs/common';

export class InvalidInviteTokenException extends NotFoundException {
  constructor() {
    super({
      error: 'INVALID_INVITE_TOKEN',
      message: 'Invite link is invalid or has been disabled',
    });
  }
}
