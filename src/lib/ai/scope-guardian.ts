import { db } from "@/utils/db";
import { activityLog, contract, contractScopeTerm, deliverable } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import type { ScopeEvaluation } from "./schemas";
import crypto from "crypto";

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
 * Evaluates whether an individual deliverable falls within the signed contract's
 * defined scope terms or matches contract exclusions.
 */
export async function evaluateDeliverableScope(
  projectId: string,
  deliverableTitle: string,
  deliverableDescription?: string | null,
): Promise<ScopeEvaluation> {
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
      currentRevision: 0,
      message: "No signed contract found. Deliverable permitted.",
    };
  }

  const terms = await db
    .select()
    .from(contractScopeTerm)
    .where(eq(contractScopeTerm.contractId, activeContract.id));

  const scopeTerms = terms.filter((t) => t.termType === "scope");
  const exclusionTerms = terms.filter((t) => t.termType === "exclusion");

  if (scopeTerms.length === 0 && exclusionTerms.length === 0) {
    return {
      status: "within_scope",
      isScopeCreep: false,
      maxRevisions: null,
      currentRevision: 0,
      message: "No contract scope terms defined in active agreement.",
    };
  }

  const normTitle = deliverableTitle.trim().toLowerCase();
  const normDesc = (deliverableDescription || "").trim().toLowerCase();

  // 1. Check if matches any contract exclusions (Highest priority alert)
  for (const excl of exclusionTerms) {
    const normExcl = excl.title.trim().toLowerCase();
    if (
      normExcl.length > 2 &&
      (normTitle.includes(normExcl) ||
        normExcl.includes(normTitle) ||
        (normDesc && normDesc.includes(normExcl)))
    ) {
      return {
        status: "scope_creep_alert",
        isScopeCreep: true,
        maxRevisions: null,
        currentRevision: 0,
        message: `Deliverable matches contract exclusion: "${excl.title}".`,
      };
    }
  }

  // 2. Check if matches contract scope items
  for (const s of scopeTerms) {
    const normScope = s.title.trim().toLowerCase();
    if (
      normScope.length > 2 &&
      (normTitle.includes(normScope) ||
        normScope.includes(normTitle) ||
        (normDesc && normDesc.includes(normScope)))
    ) {
      return {
        status: "within_scope",
        isScopeCreep: false,
        maxRevisions: null,
        currentRevision: 0,
        message: `Deliverable matches contract scope: "${s.title}".`,
      };
    }
  }

  // 3. If signed scope items exist, but deliverable matches none of them -> out of scope
  if (scopeTerms.length > 0) {
    return {
      status: "scope_creep_alert",
      isScopeCreep: true,
      maxRevisions: null,
      currentRevision: 0,
      message: `Deliverable "${deliverableTitle}" is outside the signed contract's defined scope terms.`,
    };
  }

  return {
    status: "within_scope",
    isScopeCreep: false,
    maxRevisions: null,
    currentRevision: 0,
    message: "Within contract scope.",
  };
}

/**
 * Reconciles and generates deliverables from the signed contract's scope terms.
 * When a contract is signed and its scope terms exist, this ensures that the
 * contract's scope terms are the authoritative source for project deliverables.
 *
 * Guarantees:
 * 1. Safe against overwriting: Never alters deliverables with status other than "pending"
 *    or deliverables that already have active submissions.
 * 2. Audit trail: Logs an activity_log entry whenever a deliverable description is reconciled.
 * 3. Idempotent: Can be safely re-triggered multiple times without creating duplicates.
 */
export async function reconcileContractDeliverables(
  projectId: string,
  contractId: string,
  createdBy?: string | null,
): Promise<{
  createdCount: number;
  reconciledCount: number;
  totalScopeItems: number;
}> {
  const [contractRow] = await db
    .select({ id: contract.id, fileName: contract.fileName })
    .from(contract)
    .where(eq(contract.id, contractId));

  const scopeTerms = await db
    .select()
    .from(contractScopeTerm)
    .where(
      and(
        eq(contractScopeTerm.contractId, contractId),
        eq(contractScopeTerm.termType, "scope"),
      ),
    );

  if (scopeTerms.length === 0) {
    return { createdCount: 0, reconciledCount: 0, totalScopeItems: 0 };
  }

  const existingDeliverables = await db
    .select()
    .from(deliverable)
    .where(eq(deliverable.projectId, projectId));

  let reconciledCount = 0;
  const newDeliverables: Array<typeof deliverable.$inferInsert> = [];
  const matchedDeliverableIds = new Set<string>();
  const queuedDeliverableTitles = new Set<string>();

  for (const term of scopeTerms) {
    const normTermTitle = term.title.trim().toLowerCase();

    // 1. Check if deliverable already exists matching this scope term (and hasn't already been claimed in this pass)
    const matched = existingDeliverables.find((d) => {
      if (matchedDeliverableIds.has(d.id)) return false;
      const normDTitle = d.title.trim().toLowerCase();
      if (normDTitle === normTermTitle) return true;
      if (
        normTermTitle.length > 6 &&
        normDTitle.length > 6 &&
        (normDTitle.includes(normTermTitle) || normTermTitle.includes(normDTitle))
      ) {
        return true;
      }
      return false;
    });

    if (matched) {
      matchedDeliverableIds.add(matched.id);
      reconciledCount++;

      // RISK 1 FIX: Never overwrite in-progress / engaged deliverables (in_review, approved, revision_requested, or with submissions)
      const isUntouchedDraft =
        matched.status === "pending" &&
        !matched.submissionTitle &&
        !matched.submissionUrl;

      if (isUntouchedDraft) {
        const newDesc =
          term.description ||
          `Reconciled with signed contract "${contractRow?.fileName || "SOW"}"`;

        // Only update if the description is actually different
        if (matched.description !== newDesc) {
          const previousDesc = matched.description;
          await db
            .update(deliverable)
            .set({
              description: newDesc,
              updatedAt: new Date(),
            })
            .where(eq(deliverable.id, matched.id));

          // RISK 1 FIX: Create an activity-log entry whenever a deliverable description changes
          try {
            const { logActivity } = await import("@/lib/activity");
            await logActivity({
              projectId,
              userId: createdBy || null,
              type: "deliverable_reconciled",
              metadata: {
                deliverableId: matched.id,
                title: matched.title,
                previousDescription: previousDesc,
                newDescription: newDesc,
                contractFileName: contractRow?.fileName,
              },
            });
          } catch (actErr) {
            console.error("Activity logging on reconciliation notice:", actErr);
          }
        }
      }
    } else {
      // RISK 2 FIX: Idempotency check across batch terms to prevent duplicates
      if (!queuedDeliverableTitles.has(normTermTitle)) {
        queuedDeliverableTitles.add(normTermTitle);
        newDeliverables.push({
          id: crypto.randomUUID(),
          projectId,
          title: term.title,
          description:
            term.description ||
            `Contract scope item from signed contract "${contractRow?.fileName || "SOW"}"`,
          status: "pending",
          dueDate: null,
          createdBy: createdBy || null,
        });
      }
    }
  }

  if (newDeliverables.length > 0) {
    await db.insert(deliverable).values(newDeliverables);
    
    // Log creation activities for generated deliverables
    try {
      const { logActivity } = await import("@/lib/activity");
      for (const d of newDeliverables) {
        await logActivity({
          projectId,
          userId: createdBy || null,
          type: "deliverable_created",
          metadata: {
            deliverableId: d.id,
            title: d.title,
            source: "contract_scope_reconciliation",
            contractFileName: contractRow?.fileName,
          },
        });
      }
    } catch (actErr) {
      console.error("Activity logging on deliverable generation notice:", actErr);
    }
  }

  return {
    createdCount: newDeliverables.length,
    reconciledCount,
    totalScopeItems: scopeTerms.length,
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
