import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logger/logger.service';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const port = configService.get('PORT', { infer: true });

  app.enableShutdownHooks();

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal, initiating graceful shutdown', 'App');
  });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT signal, initiating graceful shutdown', 'App');
  });

  await app.listen(port);
  logger.info(`Application started on port ${port}`, 'App', {
    port,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  });
}

bootstrap().catch((error: Error) => {
  const logger = new LoggerService();
  logger.error('Failed to start application', error.stack, 'App');
  process.exit(1);
});
