import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo<GraphQLResolveInfo>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : 'Unknown error';

    const stack = exception instanceof Error ? exception.stack : undefined;

    const isExpectedError = exception instanceof HttpException && status < 500;

    if (!isExpectedError) {
      this.logger.error(message, stack, 'ExceptionFilter', {
        statusCode: status,
        operation: info?.fieldName,
        parentType: info?.parentType?.name,
        exceptionType:
          exception instanceof Error ? exception.constructor.name : 'Unknown',
      });
    }

    throw exception;
  }
}
