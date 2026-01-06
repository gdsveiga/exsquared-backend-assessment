import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LoggerService } from '../logger/logger.service';

jest.mock('@nestjs/graphql', () => ({
  GqlArgumentsHost: {
    create: jest.fn(),
  },
  GqlExceptionFilter: class {},
}));

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logger: jest.Mocked<LoggerService>;
  let mockHost: ArgumentsHost;
  let mockGqlHost: { getInfo: jest.Mock };

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockGqlHost = {
      getInfo: jest.fn().mockReturnValue({
        fieldName: 'testOperation',
        parentType: { name: 'Query' },
      }),
    };

    (GqlArgumentsHost.create as jest.Mock).mockReturnValue(mockGqlHost);

    mockHost = {} as ArgumentsHost;

    filter = new AllExceptionsFilter(logger);
  });

  describe('catch', () => {
    it('should rethrow HttpException with status < 500', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log and rethrow HttpException with status >= 500', () => {
      const exception = new HttpException(
        'Internal Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).toHaveBeenCalledWith(
        'Internal Error',
        expect.any(String),
        'ExceptionFilter',
        expect.objectContaining({
          statusCode: 500,
          operation: 'testOperation',
          parentType: 'Query',
          exceptionType: 'HttpException',
        }),
      );
    });

    it('should log and rethrow non-HttpException errors', () => {
      const exception = new Error('Unexpected error');

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected error',
        expect.any(String),
        'ExceptionFilter',
        expect.objectContaining({
          statusCode: 500,
          operation: 'testOperation',
          parentType: 'Query',
          exceptionType: 'Error',
        }),
      );
    });

    it('should handle non-Error exceptions', () => {
      const exception = 'string error';

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).toHaveBeenCalledWith(
        'Unknown error',
        undefined,
        'ExceptionFilter',
        expect.objectContaining({
          statusCode: 500,
          exceptionType: 'Unknown',
        }),
      );
    });

    it('should handle missing GraphQL info', () => {
      mockGqlHost.getInfo.mockReturnValue(undefined);
      const exception = new Error('Test error');

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).toHaveBeenCalledWith(
        'Test error',
        expect.any(String),
        'ExceptionFilter',
        expect.objectContaining({
          operation: undefined,
          parentType: undefined,
        }),
      );
    });

    it('should not log 400 Bad Request errors', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not log 401 Unauthorized errors', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not log 403 Forbidden errors', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not log 404 Not Found errors', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log 502 Bad Gateway errors', () => {
      const exception = new HttpException(
        'Bad Gateway',
        HttpStatus.BAD_GATEWAY,
      );

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log 503 Service Unavailable errors', () => {
      const exception = new HttpException(
        'Service Unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );

      expect(() => filter.catch(exception, mockHost)).toThrow(exception);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
