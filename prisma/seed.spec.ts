import { AxiosError } from 'axios';
import {
  NetworkError,
  XmlParsingError,
  TransformationError,
  DatastoreError,
  isRetryableError,
  parseXml,
  validateMakeData,
  validateVehicleTypeData,
  transformMake,
  transformVehicleType,
  withRetry,
  sleep,
  MakeResponse,
  VehicleTypeResponse,
} from './seed';

jest.mock('axios');

describe('seed', () => {
  describe('NetworkError', () => {
    it('should create error with message only', () => {
      const error = new NetworkError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('NetworkError');
      expect(error.statusCode).toBeUndefined();
      expect(error.isRetryable).toBe(true);
    });

    it('should create error with status code', () => {
      const error = new NetworkError('Not found', 404);
      expect(error.statusCode).toBe(404);
      expect(error.isRetryable).toBe(true);
    });

    it('should create non-retryable error', () => {
      const error = new NetworkError('Bad request', 400, false);
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('XmlParsingError', () => {
    it('should create error with message', () => {
      const error = new XmlParsingError('Invalid XML');
      expect(error.message).toBe('Invalid XML');
      expect(error.name).toBe('XmlParsingError');
    });
  });

  describe('TransformationError', () => {
    it('should create error with message', () => {
      const error = new TransformationError('Invalid data');
      expect(error.message).toBe('Invalid data');
      expect(error.name).toBe('TransformationError');
    });
  });

  describe('DatastoreError', () => {
    it('should create error with default non-retryable', () => {
      const error = new DatastoreError('DB error');
      expect(error.message).toBe('DB error');
      expect(error.name).toBe('DatastoreError');
      expect(error.isRetryable).toBe(false);
    });

    it('should create retryable error', () => {
      const error = new DatastoreError('Connection timeout', true);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable NetworkError', () => {
      const error = new NetworkError('Timeout', undefined, true);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable NetworkError', () => {
      const error = new NetworkError('Bad request', 400, false);
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for retryable DatastoreError', () => {
      const error = new DatastoreError('Connection lost', true);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable DatastoreError', () => {
      const error = new DatastoreError('Constraint violation', false);
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for AxiosError with ECONNRESET', () => {
      const error = new AxiosError('Connection reset');
      error.code = 'ECONNRESET';
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for AxiosError with ETIMEDOUT', () => {
      const error = new AxiosError('Timeout');
      error.code = 'ETIMEDOUT';
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for AxiosError with ENOTFOUND', () => {
      const error = new AxiosError('Not found');
      error.code = 'ENOTFOUND';
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for AxiosError with 429 status', () => {
      const error = new AxiosError('Too many requests');
      error.response = { status: 429 } as any;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for AxiosError with 502 status', () => {
      const error = new AxiosError('Bad gateway');
      error.response = { status: 502 } as any;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for AxiosError with 503 status', () => {
      const error = new AxiosError('Service unavailable');
      error.response = { status: 503 } as any;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for AxiosError with 504 status', () => {
      const error = new AxiosError('Gateway timeout');
      error.response = { status: 504 } as any;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for AxiosError with 400 status', () => {
      const error = new AxiosError('Bad request');
      error.response = { status: 400 } as any;
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for unknown error types', () => {
      expect(isRetryableError(new Error('Generic error'))).toBe(false);
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('validateMakeData', () => {
    it('should return true for valid make data', () => {
      const data: MakeResponse = { Make_ID: '123', Make_Name: 'Toyota' };
      expect(validateMakeData(data)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateMakeData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateMakeData(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateMakeData('string')).toBe(false);
      expect(validateMakeData(123)).toBe(false);
    });

    it('should return false for missing Make_ID', () => {
      expect(validateMakeData({ Make_Name: 'Toyota' })).toBe(false);
    });

    it('should return false for missing Make_Name', () => {
      expect(validateMakeData({ Make_ID: '123' })).toBe(false);
    });

    it('should return false for null Make_ID', () => {
      expect(validateMakeData({ Make_ID: null, Make_Name: 'Toyota' })).toBe(
        false,
      );
    });

    it('should return false for null Make_Name', () => {
      expect(validateMakeData({ Make_ID: '123', Make_Name: null })).toBe(false);
    });
  });

  describe('validateVehicleTypeData', () => {
    it('should return true for valid vehicle type data', () => {
      const data: VehicleTypeResponse = {
        VehicleTypeId: '1',
        VehicleTypeName: 'Sedan',
      };
      expect(validateVehicleTypeData(data)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateVehicleTypeData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateVehicleTypeData(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateVehicleTypeData('string')).toBe(false);
      expect(validateVehicleTypeData(123)).toBe(false);
    });

    it('should return false for missing VehicleTypeId', () => {
      expect(validateVehicleTypeData({ VehicleTypeName: 'Sedan' })).toBe(false);
    });

    it('should return false for missing VehicleTypeName', () => {
      expect(validateVehicleTypeData({ VehicleTypeId: '1' })).toBe(false);
    });

    it('should return false for null VehicleTypeId', () => {
      expect(
        validateVehicleTypeData({
          VehicleTypeId: null,
          VehicleTypeName: 'Sedan',
        }),
      ).toBe(false);
    });

    it('should return false for null VehicleTypeName', () => {
      expect(
        validateVehicleTypeData({ VehicleTypeId: '1', VehicleTypeName: null }),
      ).toBe(false);
    });
  });

  describe('transformMake', () => {
    it('should transform valid make data', () => {
      const raw: MakeResponse = { Make_ID: '123', Make_Name: 'Toyota' };
      const result = transformMake(raw);
      expect(result).toEqual({ makeId: 123, makeName: 'Toyota' });
    });

    it('should trim whitespace from make name', () => {
      const raw: MakeResponse = { Make_ID: '123', Make_Name: '  Toyota  ' };
      const result = transformMake(raw);
      expect(result.makeName).toBe('Toyota');
    });

    it('should throw TransformationError for invalid Make_ID', () => {
      const raw: MakeResponse = { Make_ID: 'invalid', Make_Name: 'Toyota' };
      expect(() => transformMake(raw)).toThrow(TransformationError);
      expect(() => transformMake(raw)).toThrow('Invalid Make_ID: invalid');
    });

    it('should throw TransformationError for empty Make_Name', () => {
      const raw: MakeResponse = { Make_ID: '123', Make_Name: '' };
      expect(() => transformMake(raw)).toThrow(TransformationError);
      expect(() => transformMake(raw)).toThrow(
        'Empty Make_Name for Make_ID: 123',
      );
    });

    it('should throw TransformationError for whitespace-only Make_Name', () => {
      const raw: MakeResponse = { Make_ID: '123', Make_Name: '   ' };
      expect(() => transformMake(raw)).toThrow(TransformationError);
    });

    it('should handle numeric Make_Name', () => {
      const raw = { Make_ID: '123', Make_Name: 456 as unknown as string };
      const result = transformMake(raw);
      expect(result.makeName).toBe('456');
    });
  });

  describe('transformVehicleType', () => {
    it('should transform valid vehicle type data', () => {
      const raw: VehicleTypeResponse = {
        VehicleTypeId: '1',
        VehicleTypeName: 'Sedan',
      };
      const result = transformVehicleType(raw);
      expect(result).toEqual({ typeId: 1, typeName: 'Sedan' });
    });

    it('should trim whitespace from type name', () => {
      const raw: VehicleTypeResponse = {
        VehicleTypeId: '1',
        VehicleTypeName: '  Sedan  ',
      };
      const result = transformVehicleType(raw);
      expect(result.typeName).toBe('Sedan');
    });

    it('should throw TransformationError for invalid VehicleTypeId', () => {
      const raw: VehicleTypeResponse = {
        VehicleTypeId: 'invalid',
        VehicleTypeName: 'Sedan',
      };
      expect(() => transformVehicleType(raw)).toThrow(TransformationError);
      expect(() => transformVehicleType(raw)).toThrow(
        'Invalid VehicleTypeId: invalid',
      );
    });

    it('should throw TransformationError for empty VehicleTypeName', () => {
      const raw: VehicleTypeResponse = {
        VehicleTypeId: '1',
        VehicleTypeName: '',
      };
      expect(() => transformVehicleType(raw)).toThrow(TransformationError);
      expect(() => transformVehicleType(raw)).toThrow(
        'Empty VehicleTypeName for VehicleTypeId: 1',
      );
    });

    it('should throw TransformationError for whitespace-only VehicleTypeName', () => {
      const raw: VehicleTypeResponse = {
        VehicleTypeId: '1',
        VehicleTypeName: '   ',
      };
      expect(() => transformVehicleType(raw)).toThrow(TransformationError);
    });
  });

  describe('parseXml', () => {
    it('should parse valid XML', async () => {
      const xml = '<root><item>value</item></root>';
      const result = await parseXml<{ root: { item: string } }>(xml);
      expect(result).toEqual({ root: { item: 'value' } });
    });

    it('should parse XML with nested elements', async () => {
      const xml =
        '<Response><Results><Make><ID>1</ID><Name>Toyota</Name></Make></Results></Response>';
      const result = await parseXml<any>(xml);
      expect(result.Response.Results.Make.ID).toBe('1');
      expect(result.Response.Results.Make.Name).toBe('Toyota');
    });

    it('should throw XmlParsingError for empty string', async () => {
      await expect(parseXml('')).rejects.toThrow(XmlParsingError);
      await expect(parseXml('')).rejects.toThrow(
        'Invalid XML input: expected non-empty string',
      );
    });

    it('should throw XmlParsingError for null input', async () => {
      await expect(parseXml(null as any)).rejects.toThrow(XmlParsingError);
    });

    it('should throw XmlParsingError for undefined input', async () => {
      await expect(parseXml(undefined as any)).rejects.toThrow(XmlParsingError);
    });

    it('should throw XmlParsingError for non-string input', async () => {
      await expect(parseXml(123 as any)).rejects.toThrow(XmlParsingError);
    });

    it('should throw XmlParsingError for invalid XML', async () => {
      await expect(parseXml('<invalid')).rejects.toThrow(XmlParsingError);
    });

    it('should throw XmlParsingError for malformed XML', async () => {
      await expect(parseXml('<root><unclosed>')).rejects.toThrow(
        XmlParsingError,
      );
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(1000);
      jest.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should not resolve before specified time', async () => {
      let resolved = false;
      void sleep(1000).then(() => {
        resolved = true;
      });
      jest.advanceTimersByTime(999);
      await Promise.resolve();
      expect(resolved).toBe(false);
    });
  });

  describe('withRetry', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should return result on first success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await withRetry(operation, 'test operation');
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw immediately for non-retryable error', async () => {
      const error = new NetworkError('Bad request', 400, false);
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withRetry(operation, 'test operation')).rejects.toThrow(
        error,
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw for non-retryable error types', async () => {
      const error = new TransformationError('Invalid data');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withRetry(operation, 'test operation')).rejects.toThrow(
        error,
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
