import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  validateSync,
  IsIn,
} from 'class-validator';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string = 'development';

  @IsString()
  @IsOptional()
  NHTSA_BASE_URL: string = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  @IsString()
  @IsOptional()
  @IsIn(['debug', 'info', 'warn', 'error'])
  LOG_LEVEL: LogLevel = 'info';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
