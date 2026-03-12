import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface JwtUserPayload {
  sub: number;
  email?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {

    const req = context.switchToHttp().getRequest<Request>();

    const { method, url } = req;

    const user = req.user as JwtUserPayload | undefined;

    const userId = user?.sub ?? 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {

        const responseTime = Date.now() - startTime;

        this.logger.log(
          `${method} ${url} | user:${userId} | ${responseTime}ms`
        );

      })
    );
  }
}