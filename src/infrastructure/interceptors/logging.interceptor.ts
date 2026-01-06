import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo<GraphQLResolveInfo>();
    const operationName = info?.fieldName;
    const operationType = info?.parentType?.name;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.info('GraphQL operation completed', 'GraphQL', {
          operation: operationName,
          type: operationType,
          durationMs: duration,
        });
      }),
      catchError((error: Error) => {
        const duration = Date.now() - startTime;
        this.logger.error('GraphQL operation failed', error.stack, 'GraphQL', {
          operation: operationName,
          type: operationType,
          durationMs: duration,
          errorMessage: error.message,
        });
        return throwError(() => error);
      }),
    );
  }
}
