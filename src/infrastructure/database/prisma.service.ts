import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from '../../generated/prisma/client';
import type { EnvironmentVariables } from '../../config/env.validation';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClientType;
  private readonly pool: Pool;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly logger: LoggerService,
  ) {
    this.pool = new Pool({
      connectionString: this.configService.get('DATABASE_URL'),
    });
    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter });
  }

  get make() {
    return this.client.make;
  }

  get vehicleType() {
    return this.client.vehicleType;
  }

  async onModuleInit() {
    try {
      await this.client.$connect();
      this.logger.info('Database connection established', 'PrismaService');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to connect to database: ${message}`,
        stack,
        'PrismaService',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.info('Closing database connections', 'PrismaService');
    await this.client.$disconnect();
    await this.pool.end();
    this.logger.info('Database connections closed', 'PrismaService');
  }
}
