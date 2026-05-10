export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_TTL_MS = 60_000;

export const AUTH_THROTTLE_OPTIONS = {
  default: {
    limit: AUTH_THROTTLE_LIMIT,
    ttl: AUTH_THROTTLE_TTL_MS,
  },
} as const;
