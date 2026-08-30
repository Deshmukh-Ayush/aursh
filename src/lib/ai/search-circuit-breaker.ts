import { SEARCH_CIRCUIT_BREAKER_HOURLY_LIMIT } from "@/config/credits";

type CircuitBreakerEntry = {
  timestamps: number[];
};

const orgSearchWindowStore = new Map<string, CircuitBreakerEntry>();

/**
 * In-memory sliding-window Circuit Breaker for Web Search.
 *
 * Dedicated platform-stability safety net protecting Firecrawl & licensed search APIs
 * from runaway execution loops, client bugs, or abuse.
 *
 * Enforces a strict limit (e.g. 60 searches per hour per organization) regardless of
 * whether soft-cap credit enforcement is enabled or disabled.
 */
export function checkSearchCircuitBreaker(
  organizationId: string,
  limit: number = SEARCH_CIRCUIT_BREAKER_HOURLY_LIMIT,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = orgSearchWindowStore.get(organizationId);
  if (!entry) {
    entry = { timestamps: [] };
    orgSearchWindowStore.set(organizationId, entry);
  }

  // Filter timestamps within sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + windowMs - now);
    console.warn(
      `[Search Circuit Breaker] Org ${organizationId} hit safety limit (${entry.timestamps.length}/${limit} searches in 1hr). Temporarily throttled.`
    );
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  // Record this execution
  entry.timestamps.push(now);
  const remaining = Math.max(0, limit - entry.timestamps.length);

  return {
    allowed: true,
    remaining,
    resetMs: windowMs,
  };
}
