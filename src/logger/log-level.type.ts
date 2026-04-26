export const LOG_LEVELS = ['log', 'debug', 'warn', 'error', 'verbose'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];
