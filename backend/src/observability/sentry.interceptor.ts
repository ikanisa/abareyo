import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { captureWithSentryScope } from './sentry.js';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        captureWithSentryScope(error, {
          handler: context.getHandler()?.name,
          controller: context.getClass()?.name,
        });
        return throwError(() => error);
      }),
    );
  }
}
