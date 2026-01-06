import { ExecutionContext, CallHandler } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { LoggerService } from '../logger/logger.service';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: jest.Mocked<LoggerService>;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockGqlContext: { getInfo: jest.Mock };

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockGqlContext = {
      getInfo: jest.fn().mockReturnValue({
        fieldName: 'testOperation',
        parentType: { name: 'Query' },
      }),
    };

    (GqlExecutionContext.create as jest.Mock).mockReturnValue(mockGqlContext);

    mockContext = {} as ExecutionContext;
    mockCallHandler = {
      handle: jest.fn(),
    };

    interceptor = new LoggingInterceptor(logger);
  });

  describe('intercept', () => {
    it('should log successful operation completion', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logger.info).toHaveBeenCalledWith(
            'GraphQL operation completed',
            'GraphQL',
            expect.objectContaining({
              operation: 'testOperation',
              type: 'Query',
              durationMs: expect.any(Number),
            }),
          );
          done();
        },
      });
    });

    it('should log operation failure', (done) => {
      const testError = new Error('Test error');
      testError.stack = 'Error stack trace';
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(testError);
          expect(logger.error).toHaveBeenCalledWith(
            'GraphQL operation failed',
            'Error stack trace',
            'GraphQL',
            expect.objectContaining({
              operation: 'testOperation',
              type: 'Query',
              durationMs: expect.any(Number),
              errorMessage: 'Test error',
            }),
          );
          done();
        },
      });
    });

    it('should track duration correctly', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          const call = logger.info.mock.calls[0];
          expect(call).toBeDefined();
          expect(call![2]).toBeDefined();
          expect(
            (call![2] as Record<string, unknown>).durationMs,
          ).toBeGreaterThanOrEqual(0);
          done();
        },
      });
    });

    it('should handle missing GraphQL info', (done) => {
      mockGqlContext.getInfo.mockReturnValue(undefined);
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logger.info).toHaveBeenCalledWith(
            'GraphQL operation completed',
            'GraphQL',
            expect.objectContaining({
              operation: undefined,
              type: undefined,
            }),
          );
          done();
        },
      });
    });

    it('should pass through the response data', (done) => {
      const responseData = { id: 1, name: 'Test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
        },
        complete: () => {
          done();
        },
      });
    });

    it('should handle Mutation operations', (done) => {
      mockGqlContext.getInfo.mockReturnValue({
        fieldName: 'createUser',
        parentType: { name: 'Mutation' },
      });
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ success: true }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logger.info).toHaveBeenCalledWith(
            'GraphQL operation completed',
            'GraphQL',
            expect.objectContaining({
              operation: 'createUser',
              type: 'Mutation',
            }),
          );
          done();
        },
      });
    });

    it('should rethrow errors after logging', (done) => {
      const testError = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(testError);
          done();
        },
      });
    });
  });
});
