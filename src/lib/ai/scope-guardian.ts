import { db } from "@/utils/db";
import { contractScopeTerm, deliverable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
  // Fetch all revision_limit terms for this project
  const revisionRules = await db
    .select()
    .from(contractScopeTerm)
    .where(
      and(
        eq(contractScopeTerm.projectId, projectId),
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
        "No revision limits found in project contracts. All revisions are allowed.",
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
 * Counts revision requests for a specific deliverable by looking at
 * how many times its status has been set to "revision_requested".
 *
 * Since we don't track a separate revision counter, we use the activity log
 * or count deliverables in "revision_requested" state. For now, this accepts
 * the count as input and can be enhanced later with activity log queries.
 */
export async function getProjectRevisionCount(
  projectId: string,
): Promise<number> {
  const revisionDeliverables = await db
    .select()
    .from(deliverable)
    .where(
      and(
        eq(deliverable.projectId, projectId),
        eq(deliverable.status, "revision_requested"),
      ),
    );

  return revisionDeliverables.length;
}
