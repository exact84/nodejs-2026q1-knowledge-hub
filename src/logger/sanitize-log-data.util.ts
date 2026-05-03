const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'x-api-key',
  'cookie',
  'set-cookie',
] as const;

const REDACTED_VALUE = '[REDACTED]';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

type JsonObject = {
  [key: string]: JsonValue;
};

type JsonArray = JsonValue[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some(
    (sensitiveKey) => sensitiveKey.toLowerCase() === key.toLowerCase(),
  );
}

function sanitizeObject(value: Record<string, unknown>): JsonObject {
  const result: JsonObject = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED_VALUE;
      continue;
    }

    result[key] = sanitizeLogData(nestedValue);
  }

  return result;
}

export function sanitizeLogData(value: unknown): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogData(item));
  }

  if (isPlainObject(value)) {
    return sanitizeObject(value);
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value as JsonValue;
  }

  return String(value);
}
