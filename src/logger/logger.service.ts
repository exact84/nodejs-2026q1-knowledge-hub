import { Injectable, LoggerService } from '@nestjs/common';
import { LOG_LEVELS, LogLevel } from './log-level.type';
import { sanitizeLogData } from './sanitize-log-data.util';

type LogPayload = {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  details?: unknown;
  trace?: string;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  log: 2,
  verbose: 3,
  debug: 4,
};

function isLogLevel(value: string): value is LogLevel {
  return LOG_LEVELS.some((level) => level === value);
}

function getConfiguredLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL;

  if (!envLevel) {
    return 'log';
  }

  const normalized = envLevel.toLowerCase();
  return isLogLevel(normalized) ? normalized : 'log';
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

@Injectable()
export class AppLogger implements LoggerService {
  private readonly configuredLevel: LogLevel;

  constructor() {
    this.configuredLevel = getConfiguredLogLevel();
  }

  log(message: string, context?: string): void {
    this.write('log', message, undefined, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write('error', message, trace, context);
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, undefined, context);
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, undefined, context);
  }

  verbose(message: string, context?: string): void {
    this.write('verbose', message, undefined, context);
  }

  logWithDetails(
    level: LogLevel,
    message: string,
    details: unknown,
    context?: string,
  ): void {
    this.write(level, message, undefined, context, details);
  }

  private write(
    level: LogLevel,
    message: string,
    trace?: string,
    context?: string,
    details?: unknown,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const payload: LogPayload = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      details: details === undefined ? undefined : sanitizeLogData(details),
      trace,
    };

    const formatted = isProduction()
      ? this.formatStructured(payload)
      : this.formatHumanReadable(payload);

    if (level === 'error' || level === 'warn') {
      process.stderr.write(`${formatted}\n`);
      return;
    }

    process.stdout.write(`${formatted}\n`);
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.configuredLevel]
    );
  }

  private formatStructured(payload: LogPayload): string {
    return JSON.stringify({
      timestamp: payload.timestamp,
      level: payload.level,
      context: payload.context,
      message: payload.message,
      details: payload.details,
      trace: payload.trace,
    });
  }

  private formatHumanReadable(payload: LogPayload): string {
    const context = payload.context ? `[${payload.context}]` : '';
    const base =
      `${payload.timestamp} ${payload.level.toUpperCase()} ${context} ${payload.message}`.trim();

    if (payload.details === undefined && payload.trace === undefined) {
      return base;
    }

    return `${base} ${JSON.stringify({
      details: payload.details,
      trace: payload.trace,
    })}`;
  }
}
