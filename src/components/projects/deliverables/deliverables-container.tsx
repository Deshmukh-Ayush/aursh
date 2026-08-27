"use client";

import { DeliverableList } from "./deliverable-list";
import { DeliverablesVelocityChart } from "./deliverables-velocity-chart";
import { DeliverableItem } from "./types";
import type { ScopeEvaluation } from "@/lib/ai/schemas";

export function DeliverablesContainer({
  deliverables,
  allComments,
  memberRole,
  projectId,
  userId,
  scopeEvaluations,
  contractId,
}: {
  deliverables: DeliverableItem[];
  allComments: any[];
  memberRole: string;
  projectId: string;
  userId: string;
  scopeEvaluations?: Record<string, ScopeEvaluation>;
  contractId?: string;
}) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Velocity Trend Chart */}
      <DeliverablesVelocityChart deliverables={deliverables} />

      {/* Deliverables List Section */}
      <section aria-label="Project Deliverables List" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            All Scheduled Deliverables ({deliverables.length})
          </h2>
        </div>

        <DeliverableList
          deliverables={deliverables}
          allComments={allComments}
          memberRole={memberRole}
          projectId={projectId}
          userId={userId}
          scopeEvaluations={scopeEvaluations}
          contractId={contractId}
        />
      </section>
    </div>
  );
}
