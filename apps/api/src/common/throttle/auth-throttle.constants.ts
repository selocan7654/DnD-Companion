/** Auth brute-force bucket: 5 requests per 15 minutes per IP — docs/07 §10 */
export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_TTL_MS = 15 * 60 * 1000;
export const AUTH_THROTTLE_RETRY_AFTER_SECONDS = 900;

export const AUTH_THROTTLE = {
  auth: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS },
} as const;
