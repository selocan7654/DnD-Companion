import 'reflect-metadata';

import {
  REQUIRE_VERIFIED_EMAIL_KEY,
  RequireVerifiedEmail,
} from './require-verified-email.decorator';

describe('RequireVerifiedEmail decorator', () => {
  it('sets metadata key', () => {
    class TestController {
      @RequireVerifiedEmail()
      handler() {
        return undefined;
      }
    }

    const metadata = Reflect.getMetadata(
      REQUIRE_VERIFIED_EMAIL_KEY,
      TestController.prototype.handler,
    );
    expect(metadata).toBe(true);
  });
});
