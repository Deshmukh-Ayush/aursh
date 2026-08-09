import { db } from "@/utils/db";
import { activityLog, contract, contractScopeTerm } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import type { ScopeEvaluation } from "./schemas";

/**
 * Evaluates whether a deliverable revision request constitutes scope creep.
 *
 * Compares the current revision count against any `revision_limit` terms
 * extracted from the project's contracts. If no revision limits exist in the
 * DB, the request is considered within scope (no AI rules to enforce).
 *
 * @param projectId        - The project to check scope rules for.
 * @param currentRevision  - The revision number being requested (1-indexed).
 * @returns ScopeEvaluation with status, limit info, and human-readable message.
 */
export async function evaluateScopeStatus(
  projectId: string,
  currentRevision: number,
): Promise<ScopeEvaluation> {
  // Only the latest signed agreement is authoritative. Historical agreements
  // must not change the scope policy for the current engagement.
  const [activeContract] = await db
    .select({ id: contract.id })
    .from(contract)
    .where(and(eq(contract.projectId, projectId), eq(contract.status, "signed")))
    .orderBy(desc(contract.createdAt))
    .limit(1);

  if (!activeContract) {
    return {
      status: "within_scope",
      isScopeCreep: false,
      maxRevisions: null,
      currentRevision,
      message: "No signed contract with revision limits exists. All revisions are allowed.",
    };
  }

  const revisionRules = await db
    .select()
    .from(contractScopeTerm)
    .where(
      and(
        eq(contractScopeTerm.contractId, activeContract.id),
        eq(contractScopeTerm.termType, "revision_limit"),
      ),
    );

  // No AI-extracted revision rules → no enforcement possible
  if (revisionRules.length === 0) {
    return {
      status: "within_scope",
      isScopeCreep: false,
      maxRevisions: null,
      currentRevision,
      message:
        "No revision limits found in the active contract. All revisions are allowed.",
    };
  }

  // Use the strictest (lowest) revision limit across all contract terms
  const strictestLimit = Math.min(
    ...revisionRules
      .map((r) => r.maxRevisions)
      .filter((n): n is number => n !== null),
  );

  if (currentRevision > strictestLimit) {
    return {
      status: "scope_creep_alert",
      isScopeCreep: true,
      maxRevisions: strictestLimit,
      currentRevision,
      message: `Revision #${currentRevision} exceeds the contract limit of ${strictestLimit} revision${strictestLimit === 1 ? "" : "s"}. Consider generating a Change Order addendum.`,
    };
  }

  if (currentRevision === strictestLimit) {
    return {
      status: "limit_reached",
      isScopeCreep: false,
      maxRevisions: strictestLimit,
      currentRevision,
      message: `This is the final revision allowed by the contract (${currentRevision}/${strictestLimit}). Any further revisions will trigger a scope creep alert.`,
    };
  }

  return {
    status: "within_scope",
    isScopeCreep: false,
    maxRevisions: strictestLimit,
    currentRevision,
    message: `Revision ${currentRevision}/${strictestLimit} — within contract scope.`,
  };
}

/**
 * Counts revision requests from the immutable activity history, rather than
 * the current status of unrelated deliverables.
 */
export async function getProjectRevisionCount(
  projectId: string,
): Promise<number> {
  const revisionActivities = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.projectId, projectId),
        eq(activityLog.type, "revision_requested"),
      ),
    );

  return revisionActivities.length;
}
