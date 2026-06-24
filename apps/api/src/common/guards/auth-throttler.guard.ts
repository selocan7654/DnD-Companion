import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AUTH_THROTTLE_RETRY_AFTER_SECONDS } from '../throttle/auth-throttle.constants';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    // Required by ThrottlerGuard signature; response shape is fixed for auth endpoints.
    ..._args: unknown[]
  ): Promise<void> {
    void _args;
    const { res } = this.getRequestResponse(context);
    res.setHeader('Retry-After', String(AUTH_THROTTLE_RETRY_AFTER_SECONDS));

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
