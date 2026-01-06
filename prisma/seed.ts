import 'dotenv/config';
import axios, { AxiosError } from 'axios';
import { parseStringPromise } from 'xml2js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const NHTSA_BASE_URL =
  process.env.NHTSA_BASE_URL || 'https://vpic.nhtsa.dot.gov/api/vehicles';

export const HTTP_TIMEOUT = 30000;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    context: 'Seed',
    message,
    ...meta,
  };
  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export interface MakeResponse {
  Make_ID: string;
  Make_Name: string;
}

export interface VehicleTypeResponse {
  VehicleTypeId: string;
  VehicleTypeName: string;
}

interface ParsedMakesResponse {
  Response?: {
    Results?: {
      AllVehicleMakes?: MakeResponse | MakeResponse[];
    };
  };
}

interface ParsedVehicleTypesResponse {
  Response?: {
    Results?: {
      VehicleTypesForMakeIds?: VehicleTypeResponse | VehicleTypeResponse[];
    };
  };
}

interface IngestionStats {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ makeId: number; error: string }>;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = true,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class XmlParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XmlParsingError';
  }
}

export class TransformationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransformationError';
  }
}

export class DatastoreError extends Error {
  constructor(
    message: string,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'DatastoreError';
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return error.isRetryable;
  }
  if (error instanceof DatastoreError) {
    return error.isRetryable;
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      status === 429 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  }
  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      log('warn', `${operationName} failed, retrying`, {
        attempt,
        maxRetries: MAX_RETRIES,
        retryDelayMs: delay,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function fetchWithTimeout(url: string): Promise<string> {
  try {
    const response = await axios.get<string>(url, {
      timeout: HTTP_TIMEOUT,
      validateStatus: (status) => status < 500,
    });

    if (response.status >= 400) {
      throw new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.status >= 500,
      );
    }

    return response.data;
  } catch (error) {
    if (error instanceof NetworkError) {
      throw error;
    }
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        throw new NetworkError(
          `Request timeout after ${HTTP_TIMEOUT}ms`,
          undefined,
          true,
        );
      }
      throw new NetworkError(
        error.message,
        error.response?.status,
        isRetryableError(error),
      );
    }
    throw new NetworkError(String(error));
  }
}

export async function parseXml<T>(xml: string): Promise<T> {
  if (!xml || typeof xml !== 'string') {
    throw new XmlParsingError('Invalid XML input: expected non-empty string');
  }

  try {
    const result = (await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: true,
      trim: true,
    })) as T | null;

    if (!result) {
      throw new XmlParsingError('XML parsing returned empty result');
    }

    return result;
  } catch (error) {
    if (error instanceof XmlParsingError) {
      throw error;
    }
    throw new XmlParsingError(
      `Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function validateMakeData(data: unknown): data is MakeResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'Make_ID' in data &&
    'Make_Name' in data &&
    data.Make_ID != null &&
    data.Make_Name != null
  );
}

export function validateVehicleTypeData(
  data: unknown,
): data is VehicleTypeResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'VehicleTypeId' in data &&
    'VehicleTypeName' in data &&
    data.VehicleTypeId != null &&
    data.VehicleTypeName != null
  );
}

export function transformMake(raw: MakeResponse): {
  makeId: number;
  makeName: string;
} {
  const makeId = parseInt(raw.Make_ID, 10);
  if (isNaN(makeId)) {
    throw new TransformationError(`Invalid Make_ID: ${raw.Make_ID}`);
  }

  const makeName = String(raw.Make_Name).trim();
  if (!makeName) {
    throw new TransformationError(
      `Empty Make_Name for Make_ID: ${raw.Make_ID}`,
    );
  }

  return { makeId, makeName };
}

export function transformVehicleType(raw: VehicleTypeResponse): {
  typeId: number;
  typeName: string;
} {
  const typeId = parseInt(raw.VehicleTypeId, 10);
  if (isNaN(typeId)) {
    throw new TransformationError(
      `Invalid VehicleTypeId: ${raw.VehicleTypeId}`,
    );
  }

  const typeName = String(raw.VehicleTypeName).trim();
  if (!typeName) {
    throw new TransformationError(
      `Empty VehicleTypeName for VehicleTypeId: ${raw.VehicleTypeId}`,
    );
  }

  return { typeId, typeName };
}

async function fetchAllMakes(): Promise<
  { makeId: number; makeName: string }[]
> {
  log('info', 'Fetching all makes from NHTSA API');

  const data = await withRetry(
    () => fetchWithTimeout(`${NHTSA_BASE_URL}/getallmakes?format=XML`),
    'Fetch all makes',
  );

  const parsed = await parseXml<ParsedMakesResponse>(data);
  const results = parsed?.Response?.Results?.AllVehicleMakes;

  if (!results) {
    log('warn', 'No makes found in API response');
    return [];
  }

  const rawMakes = Array.isArray(results) ? results : [results];
  const validMakes: { makeId: number; makeName: string }[] = [];

  for (const raw of rawMakes) {
    if (!validateMakeData(raw)) {
      log('warn', 'Skipping invalid make data', { rawData: raw });
      continue;
    }
    try {
      validMakes.push(transformMake(raw));
    } catch (error) {
      log('warn', 'Skipping make due to transformation error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  log('info', 'Fetched valid makes', { count: validMakes.length });
  return validMakes;
}

async function fetchVehicleTypes(
  makeId: number,
): Promise<{ typeId: number; typeName: string }[]> {
  const data = await withRetry(
    () =>
      fetchWithTimeout(
        `${NHTSA_BASE_URL}/GetVehicleTypesForMakeId/${makeId}?format=XML`,
      ),
    `Fetch vehicle types for make ${makeId}`,
  );

  const parsed = await parseXml<ParsedVehicleTypesResponse>(data);
  const results = parsed?.Response?.Results?.VehicleTypesForMakeIds;

  if (!results) {
    return [];
  }

  const rawTypes = Array.isArray(results) ? results : [results];
  const validTypes: { typeId: number; typeName: string }[] = [];

  for (const raw of rawTypes) {
    if (!validateVehicleTypeData(raw)) {
      continue;
    }
    try {
      validTypes.push(transformVehicleType(raw));
    } catch {
      continue;
    }
  }

  return validTypes;
}

async function upsertMakeWithVehicleTypes(
  make: { makeId: number; makeName: string },
  vehicleTypes: { typeId: number; typeName: string }[],
): Promise<void> {
  try {
    await prisma.make.upsert({
      where: { makeId: make.makeId },
      update: { makeName: make.makeName },
      create: {
        makeId: make.makeId,
        makeName: make.makeName,
        vehicleTypes: {
          create: vehicleTypes.map((vt) => ({
            typeId: vt.typeId,
            typeName: vt.typeName,
          })),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isConnectionError =
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('ECONNREFUSED');

    throw new DatastoreError(
      `Failed to upsert make ${make.makeId}: ${message}`,
      isConnectionError,
    );
  }
}

async function main() {
  log('info', 'Starting data ingestion');

  const stats: IngestionStats = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  let makes: { makeId: number; makeName: string }[];
  try {
    makes = await fetchAllMakes();
  } catch (error) {
    log('error', 'Fatal: Failed to fetch makes list', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  stats.total = makes.length;

  for (let i = 0; i < makes.length; i++) {
    const make = makes[i];
    if (!make) continue;

    try {
      const vehicleTypes = await fetchVehicleTypes(make.makeId);

      await withRetry(
        () => upsertMakeWithVehicleTypes(make, vehicleTypes),
        `Upsert make ${make.makeId}`,
      );

      stats.successful++;

      if ((i + 1) % 100 === 0) {
        log('info', 'Ingestion progress', {
          processed: i + 1,
          total: makes.length,
          successful: stats.successful,
          failed: stats.failed,
        });
      }
    } catch (error) {
      stats.failed++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      stats.errors.push({ makeId: make.makeId, error: errorMessage });
      log('error', 'Failed to process make', {
        makeId: make.makeId,
        error: errorMessage,
      });
    }
  }

  const summaryLevel = stats.failed > 0 ? 'warn' : 'info';
  log(summaryLevel, 'Ingestion completed', {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    ...(stats.errors.length > 0 && {
      failedMakes: stats.errors.slice(0, 10),
      additionalFailures:
        stats.errors.length > 10 ? stats.errors.length - 10 : 0,
    }),
  });
}

main()
  .catch((e: unknown) => {
    log('error', 'Fatal error during ingestion', {
      error: e instanceof Error ? e.message : String(e),
    });
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
