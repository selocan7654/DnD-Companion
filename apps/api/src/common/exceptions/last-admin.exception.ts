import { UnprocessableEntityException } from '@nestjs/common';

export class LastAdminException extends UnprocessableEntityException {
  constructor() {
    super({
      error: 'LAST_ADMIN',
      message: 'Cannot remove the last admin from the system',
    });
  }
}
