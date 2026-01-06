import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogLevel } from '../../config/env.validation';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly minLevel: LogLevel;

  constructor(private readonly configService?: ConfigService) {
    this.minLevel = this.configService?.get<LogLevel>('LOG_LEVEL') ?? 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatLog(
    level: LogLevel,
    message: string,
    context?: string,
    meta?: Record<string, unknown>,
  ): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...meta,
    };
    return JSON.stringify(entry);
  }

  log(message: string, context?: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog('info')) return;
    console.log(this.formatLog('info', message, context, meta));
  }

  info(message: string, context?: string, meta?: Record<string, unknown>) {
    this.log(message, context, meta);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, unknown>,
  ) {
    if (!this.shouldLog('error')) return;
    console.error(
      this.formatLog('error', message, context, {
        ...meta,
        ...(trace && { stack: trace }),
      }),
    );
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatLog('warn', message, context, meta));
  }

  debug(message: string, context?: string, meta?: Record<string, unknown>) {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatLog('debug', message, context, meta));
  }
}
