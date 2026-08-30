import { db } from "@/utils/db";
import { organization, organizationCreditPeriod, usageEvent } from "@/db/schema";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";
import { getPlanCreditAllotments, ENFORCE_CREDIT_LIMITS } from "@/config/credits";
import crypto from "crypto";

export interface CreditUsageParams {
  organizationId: string;
  userId?: string | null;
  type: "ai_tool_call" | "web_search";
  toolName: string;
  metadata?: Record<string, unknown>;
}

export interface CreditAllowanceResult {
  allowed: boolean;
  isSoftCap: boolean;
  reason?: string;
  remainingAiCredits: number;
  remainingSearchCredits: number;
  period: typeof organizationCreditPeriod.$inferSelect;
}

/**
 * Calculates current billing cycle period bounds for an organization.
 */
function computeBillingPeriodBounds(
  orgCreatedAt: Date,
  currentPeriodEnd: Date | null,
  now: Date
): { periodStart: Date; periodEnd: Date } {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

  if (currentPeriodEnd) {
    const periodEnd = new Date(currentPeriodEnd);
    if (now <= periodEnd) {
      const periodStart = new Date(periodEnd.getTime() - THIRTY_DAYS_MS);
      return {
        periodStart: periodStart < orgCreatedAt ? orgCreatedAt : periodStart,
        periodEnd,
      };
    } else {
      // Past renewal date: roll forward in 30-day increments
      const elapsedSinceRenewal = now.getTime() - periodEnd.getTime();
      const cyclesPast = Math.floor(elapsedSinceRenewal / THIRTY_DAYS_MS) + 1;
      const newStart = new Date(periodEnd.getTime() + (cyclesPast - 1) * THIRTY_DAYS_MS);
      const newEnd = new Date(newStart.getTime() + THIRTY_DAYS_MS);
      return { periodStart: newStart, periodEnd: newEnd };
    }
  }

  // Free/Trial fallback: 30-day cycle anchored to organization creation date
  const elapsed = now.getTime() - orgCreatedAt.getTime();
  const cycleIndex = Math.max(0, Math.floor(elapsed / THIRTY_DAYS_MS));
  const periodStart = new Date(orgCreatedAt.getTime() + cycleIndex * THIRTY_DAYS_MS);
  const periodEnd = new Date(periodStart.getTime() + THIRTY_DAYS_MS);

  return { periodStart, periodEnd };
}

/**
 * Retrieves the active credit period for an organization, or creates a new one
 * aligned with its billing cycle if no active period exists.
 *
 * Sizing rules:
 * - Sized by plan tier + paid seat capacity.
 * - If seat count/plan tier changes mid-cycle, resizes the pool immediately without resetting usage.
 * - When period expires, creates a clean period with 0 used credits (no rollover).
 */
export async function getOrCreateActiveCreditPeriod(
  organizationId: string
): Promise<typeof organizationCreditPeriod.$inferSelect> {
  const now = new Date();

  const [org] = await db
    .select({
      id: organization.id,
      plan: organization.plan,
      createdAt: organization.createdAt,
      currentPeriodEnd: organization.currentPeriodEnd,
    })
    .from(organization)
    .where(eq(organization.id, organizationId));

  if (!org) {
    throw new Error(`Organization ${organizationId} not found`);
  }

  const expectedAllotment = getPlanCreditAllotments(org.plan);

  // Look for an existing period that covers the current timestamp (with 1-min skew tolerance)
  const bufferNow = new Date(now.getTime() + 60 * 1000);
  const [activePeriod] = await db
    .select()
    .from(organizationCreditPeriod)
    .where(
      and(
        eq(organizationCreditPeriod.organizationId, organizationId),
        lte(organizationCreditPeriod.periodStart, bufferNow),
        gte(organizationCreditPeriod.periodEnd, now)
      )
    )
    .orderBy(desc(organizationCreditPeriod.createdAt))
    .limit(1);

  if (activePeriod) {
    // Check if plan tier or seat allotment changed mid-cycle -> resize pool immediately
    if (
      activePeriod.aiCreditsAllotted !== expectedAllotment.aiCredits ||
      activePeriod.searchCreditsAllotted !== expectedAllotment.searchCredits
    ) {
      await db
        .update(organizationCreditPeriod)
        .set({
          aiCreditsAllotted: expectedAllotment.aiCredits,
          searchCreditsAllotted: expectedAllotment.searchCredits,
          updatedAt: now,
        })
        .where(eq(organizationCreditPeriod.id, activePeriod.id));

      activePeriod.aiCreditsAllotted = expectedAllotment.aiCredits;
      activePeriod.searchCreditsAllotted = expectedAllotment.searchCredits;
    }

    return activePeriod;
  }

  // Create a new period aligned with the billing cycle (resets usage to 0, no rollover)
  const { periodStart, periodEnd } = computeBillingPeriodBounds(
    org.createdAt ? new Date(org.createdAt) : now,
    org.currentPeriodEnd ? new Date(org.currentPeriodEnd) : null,
    now
  );

  const cleanPeriodStart = periodStart > now ? now : periodStart;
  const newPeriodId = crypto.randomUUID();

  const [newPeriod] = await db
    .insert(organizationCreditPeriod)
    .values({
      id: newPeriodId,
      organizationId,
      periodStart: cleanPeriodStart,
      periodEnd,
      aiCreditsAllotted: expectedAllotment.aiCredits,
      aiCreditsUsed: 0,
      searchCreditsAllotted: expectedAllotment.searchCredits,
      searchCreditsUsed: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return newPeriod;
}

/**
 * Checks if the organization is allowed to execute an AI tool call or web search.
 *
 * Soft-cap behavior:
 * - If ENFORCE_CREDIT_LIMITS is false, this always returns allowed: true (never blocks).
 * - If ENFORCE_CREDIT_LIMITS is true, validates usage against allotment.
 */
export async function checkCreditAllowance(
  organizationId: string,
  type: "ai" | "search" = "ai"
): Promise<CreditAllowanceResult> {
  const period = await getOrCreateActiveCreditPeriod(organizationId);

  const remainingAi = Math.max(0, period.aiCreditsAllotted - period.aiCreditsUsed);
  const remainingSearch = Math.max(0, period.searchCreditsAllotted - period.searchCreditsUsed);

  if (!ENFORCE_CREDIT_LIMITS) {
    return {
      allowed: true,
      isSoftCap: true,
      remainingAiCredits: remainingAi,
      remainingSearchCredits: remainingSearch,
      period,
    };
  }

  // Hard enforcement mode (when enabled)
  let allowed = true;
  let reason: string | undefined;

  if (type === "search") {
    if (period.searchCreditsUsed >= period.searchCreditsAllotted) {
      allowed = false;
      reason = "Web search credit limit reached for current billing period.";
    } else if (period.aiCreditsUsed >= period.aiCreditsAllotted) {
      allowed = false;
      reason = "AI credit limit reached for current billing period.";
    }
  } else {
    if (period.aiCreditsUsed >= period.aiCreditsAllotted) {
      allowed = false;
      reason = "AI credit limit reached for current billing period.";
    }
  }

  return {
    allowed,
    isSoftCap: false,
    reason,
    remainingAiCredits: remainingAi,
    remainingSearchCredits: remainingSearch,
    period,
  };
}

/**
 * Records an AI tool call or web search usage event.
 * Atomically increments organization-level pooled counters and logs to usage_event table.
 */
export async function recordCreditUsage({
  organizationId,
  userId,
  type,
  toolName,
  metadata,
}: CreditUsageParams): Promise<{
  aiCreditsUsed: number;
  searchCreditsUsed: number;
}> {
  const period = await getOrCreateActiveCreditPeriod(organizationId);
  const now = new Date();

  // Atomically increment org-level counters
  const isSearch = type === "web_search";
  const [updated] = await db
    .update(organizationCreditPeriod)
    .set({
      aiCreditsUsed: sql`${organizationCreditPeriod.aiCreditsUsed} + 1`,
      searchCreditsUsed: isSearch
        ? sql`${organizationCreditPeriod.searchCreditsUsed} + 1`
        : organizationCreditPeriod.searchCreditsUsed,
      updatedAt: now,
    })
    .where(eq(organizationCreditPeriod.id, period.id))
    .returning({
      aiCreditsUsed: organizationCreditPeriod.aiCreditsUsed,
      searchCreditsUsed: organizationCreditPeriod.searchCreditsUsed,
    });

  // Log usage audit event
  await db.insert(usageEvent).values({
    id: crypto.randomUUID(),
    organizationId,
    userId: userId || null,
    type,
    toolName,
    metadata: metadata || null,
    createdAt: now,
  });

  return {
    aiCreditsUsed: updated?.aiCreditsUsed ?? period.aiCreditsUsed + 1,
    searchCreditsUsed: updated?.searchCreditsUsed ?? (isSearch ? period.searchCreditsUsed + 1 : period.searchCreditsUsed),
  };
}

/**
 * Helper to fetch a clean summary of current credit usage for display.
 */
export async function getOrganizationCreditSummary(organizationId: string) {
  const period = await getOrCreateActiveCreditPeriod(organizationId);

  const [org] = await db
    .select({
      id: organization.id,
      name: organization.name,
      plan: organization.plan,
    })
    .from(organization)
    .where(eq(organization.id, organizationId));

  return {
    organizationId,
    plan: org?.plan || "free",
    aiCreditsUsed: period.aiCreditsUsed,
    aiCreditsAllotted: period.aiCreditsAllotted,
    searchCreditsUsed: period.searchCreditsUsed,
    searchCreditsAllotted: period.searchCreditsAllotted,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    isSoftCap: !ENFORCE_CREDIT_LIMITS,
  };
}
