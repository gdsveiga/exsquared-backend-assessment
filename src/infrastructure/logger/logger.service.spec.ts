import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createService(logLevel?: string): LoggerService {
    const configService = {
      get: jest.fn().mockReturnValue(logLevel),
    } as unknown as ConfigService;
    return new LoggerService(configService);
  }

  describe('log', () => {
    it('should log message with info level', () => {
      const service = createService('info');
      service.log('Test message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.level).toBe('info');
      expect(output.message).toBe('Test message');
      expect(output.timestamp).toBeDefined();
    });

    it('should include context when provided', () => {
      const service = createService('info');
      service.log('Test message', 'TestContext');

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.context).toBe('TestContext');
    });

    it('should include meta when provided', () => {
      const service = createService('info');
      service.log('Test message', 'TestContext', { key: 'value' });

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.key).toBe('value');
    });

    it('should not include context when not provided', () => {
      const service = createService('info');
      service.log('Test message');

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.context).toBeUndefined();
    });
  });

  describe('info', () => {
    it('should call log method', () => {
      const service = createService('info');
      const logSpy = jest.spyOn(service, 'log');
      service.info('Test message', 'TestContext', { key: 'value' });

      expect(logSpy).toHaveBeenCalledWith('Test message', 'TestContext', {
        key: 'value',
      });
    });
  });

  describe('error', () => {
    it('should log message with error level', () => {
      const service = createService('info');
      service.error('Error message');

      expect(consoleSpy.error).toHaveBeenCalled();
      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.level).toBe('error');
      expect(output.message).toBe('Error message');
    });

    it('should include stack trace when provided', () => {
      const service = createService('info');
      service.error('Error message', 'stack trace here');

      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.stack).toBe('stack trace here');
    });

    it('should include context when provided', () => {
      const service = createService('info');
      service.error('Error message', undefined, 'TestContext');

      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.context).toBe('TestContext');
    });

    it('should include meta when provided', () => {
      const service = createService('info');
      service.error('Error message', undefined, undefined, { errorCode: 500 });

      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.errorCode).toBe(500);
    });

    it('should not include stack when not provided', () => {
      const service = createService('info');
      service.error('Error message');

      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.stack).toBeUndefined();
    });
  });

  describe('warn', () => {
    it('should log message with warn level', () => {
      const service = createService('info');
      service.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
      const output = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
      expect(output.level).toBe('warn');
      expect(output.message).toBe('Warning message');
    });

    it('should include context when provided', () => {
      const service = createService('info');
      service.warn('Warning message', 'TestContext');

      const output = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
      expect(output.context).toBe('TestContext');
    });

    it('should include meta when provided', () => {
      const service = createService('info');
      service.warn('Warning message', undefined, { warnCode: 'W001' });

      const output = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
      expect(output.warnCode).toBe('W001');
    });
  });

  describe('debug', () => {
    it('should log message with debug level', () => {
      const service = createService('debug');
      service.debug('Debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
      const output = JSON.parse(consoleSpy.debug.mock.calls[0][0]);
      expect(output.level).toBe('debug');
      expect(output.message).toBe('Debug message');
    });

    it('should include context when provided', () => {
      const service = createService('debug');
      service.debug('Debug message', 'TestContext');

      const output = JSON.parse(consoleSpy.debug.mock.calls[0][0]);
      expect(output.context).toBe('TestContext');
    });

    it('should include meta when provided', () => {
      const service = createService('debug');
      service.debug('Debug message', undefined, { debugData: 'test' });

      const output = JSON.parse(consoleSpy.debug.mock.calls[0][0]);
      expect(output.debugData).toBe('test');
    });
  });

  describe('timestamp', () => {
    it('should include valid ISO timestamp', () => {
      const service = createService('info');
      service.log('Test message');

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      const timestamp = new Date(output.timestamp);
      expect(timestamp.toISOString()).toBe(output.timestamp);
    });
  });

  describe('log level filtering', () => {
    it('should not log debug when level is info', () => {
      const service = createService('info');
      service.debug('Debug message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should log debug when level is debug', () => {
      const service = createService('debug');
      service.debug('Debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should not log info when level is warn', () => {
      const service = createService('warn');
      service.log('Info message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should log warn when level is warn', () => {
      const service = createService('warn');
      service.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should only log error when level is error', () => {
      const service = createService('error');
      service.debug('Debug');
      service.log('Info');
      service.warn('Warn');
      service.error('Error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should default to info level when no config', () => {
      const service = new LoggerService();
      service.debug('Debug');
      service.log('Info');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });
});
