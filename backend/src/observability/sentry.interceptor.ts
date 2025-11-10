import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { captureWithSentryScope } from './sentry.js';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest<{ id?: string; headers?: Record<string, unknown> }>();
        const correlationId =
          typeof request?.id === 'string' && request.id.length > 0
            ? request.id
            : (request?.headers?.['x-correlation-id'] as string | undefined);

        captureWithSentryScope(error, {
          handler: context.getHandler()?.name,
          controller: context.getClass()?.name,
          correlationId,
        });
        return throwError(() => error);
      }),
    );
  }
}
