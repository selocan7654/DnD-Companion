import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_VERIFIED_EMAIL_KEY } from '../decorators/require-verified-email.decorator';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requireVerified = this.reflector.getAllAndOverride<boolean>(REQUIRE_VERIFIED_EMAIL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requireVerified) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      return true;
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email to perform this action',
      });
    }

    return true;
  }
}
