import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash environment variables are present
const isUpstashConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

let redis: Redis | null = null;

if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Helper factory to create rate limiters
function createLimiter(requests: number, windowStr: `${number} s` | `${number} m` | `${number} h`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, windowStr),
    analytics: true,
  });
}

export const authRateLimiter = createLimiter(10, "1 m"); // 10 requests per minute
export const uploadRateLimiter = createLimiter(10, "1 m"); // 10 uploads per minute
export const inviteRateLimiter = createLimiter(5, "10 m"); // 5 invites per 10 minutes
export const commentRateLimiter = createLimiter(20, "1 m"); // 20 comments per minute

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  // If Upstash is not configured, bypass rate limiting safely
  if (!limiter) {
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    console.error("Rate limiting check error:", err);
    // Fallback to true if Redis connection temporarily fails so user action is not blocked
    return { success: true };
  }
}
