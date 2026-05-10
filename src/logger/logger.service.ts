import { Injectable, LoggerService } from '@nestjs/common';
import { LOG_LEVELS, LogLevel } from './log-level.type';
import { sanitizeLogData } from './sanitize-log-data.util';
import { writeToFile } from './file-rotator.util';

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

const ANSI_RESET = '\x1b[0m';
const ANSI_DIM = '\x1b[2m';

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  log: '\x1b[32m',
  verbose: '\x1b[35m',
  debug: '\x1b[36m',
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
    if (process.env.NODE_ENV === 'test') {
      return;
    }
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
    } else {
      process.stdout.write(`${formatted}\n`);
    }

    writeToFile(formatted);
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.configuredLevel]
    );
  }

  private formatStructured(payload: LogPayload): string {
    const details = payload.details as Record<string, unknown> | undefined;

    return JSON.stringify({
      timestamp: payload.timestamp,
      level: payload.level,
      context: payload.context,
      message: payload.message,
      method: details?.method,
      path: details?.path,
      statusCode: details?.statusCode,
      details: payload.details,
      trace: payload.trace,
    });
  }

  private formatHumanReadable(payload: LogPayload): string {
    const color = LOG_LEVEL_COLORS[payload.level];
    const timestamp = `${ANSI_DIM}${payload.timestamp}${ANSI_RESET}`;
    const level = `${color}${payload.level.toUpperCase()}${ANSI_RESET}`;
    const context = payload.context
      ? `${ANSI_DIM}[${payload.context}]${ANSI_RESET}`
      : '';
    const base = `${timestamp} ${level} ${context} ${payload.message}`.trim();

    if (payload.details === undefined && payload.trace === undefined) {
      return base;
    }

    const blocks: string[] = [base];

    if (payload.details !== undefined) {
      const formattedDetails = JSON.stringify(payload.details, null, 2)
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n');

      blocks.push(`  details:\n${formattedDetails}`);
    }

    if (payload.trace !== undefined) {
      const formattedTrace = payload.trace
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n');

      blocks.push(`  trace:\n${formattedTrace}`);
    }

    return blocks.join('\n');
  }
}
