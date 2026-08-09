/**
 * @deprecated Prefer `checkRateLimit` from `@/lib/ratelimit` which uses
 * Upstash Redis for distributed rate limiting. This in-memory fallback
 * is unreliable in serverless environments (state lost on cold starts).
 */
// Basic in-memory rate limiter for Vercel Serverless Functions.
// Note: This state is lost on cold starts, but it's enough to prevent basic spam loops.

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  let entry = store.get(identifier);

  // If entry doesn't exist or is expired, create a new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(identifier, entry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  store.set(identifier, entry);

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return {
    success,
    limit,
    remaining,
    reset: entry.resetAt,
  };
}
