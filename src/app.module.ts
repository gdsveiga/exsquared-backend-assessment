import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { validate } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { GraphqlModule } from './presentation/graphql/graphql.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { AllExceptionsFilter } from './infrastructure/filters/all-exceptions.filter';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    GraphqlModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
