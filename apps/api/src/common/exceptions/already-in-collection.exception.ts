import { ConflictException } from '@nestjs/common';

export class AlreadyInCollectionException extends ConflictException {
  constructor() {
    super({
      error: 'ALREADY_IN_COLLECTION',
      message: 'This item is already in your collection',
    });
  }
}
