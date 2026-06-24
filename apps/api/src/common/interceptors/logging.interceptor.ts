import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';

type RequestWithUser = Request & { user?: AuthUser };

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
    req.requestId = requestId;

    const { method, originalUrl } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const duration = Date.now() - start;
        const userId = req.user?.id;

        this.logger.log(
          JSON.stringify({
            requestId,
            method,
            url: originalUrl,
            statusCode: res.statusCode,
            duration,
            ...(userId ? { userId } : {}),
          }),
        );
      }),
    );
  }
}
