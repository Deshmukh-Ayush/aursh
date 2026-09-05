import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { deliverable, comment, user, contract } from "@/db/schema";
import { eq, and, desc, isNotNull, asc } from "drizzle-orm";
import { CreateDeliverableDialog } from "../../../../components/projects/deliverables/create-deliverable-dialog";
import { DeliverablesContainer } from "@/components/projects/deliverables/deliverables-container";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";
import { evaluateDeliverableScope } from "@/lib/ai/scope-guardian";
import type { ScopeEvaluation } from "@/lib/ai/schemas";

export const metadata: Metadata = {
  title: "Deliverables",
  description: "Track and manage project deliverables, reviews, and approvals.",
};

async function DeliverablesData({ projectId }: { projectId: string }) {
  const [session, access] = await Promise.all([
    getCachedSession(),
    getProjectAccess(projectId),
  ]);
  const userId = session.user.id;
  const role = access.role || "agency";
  const [deliverablesList, allComments, activeContract] = await Promise.all([
    db.select().from(deliverable).where(eq(deliverable.projectId, projectId)).orderBy(desc(deliverable.createdAt)),
    db
      .select({
        comment: comment,
        author: user
      })
      .from(comment)
      .leftJoin(user, eq(comment.userId, user.id))
      .where(and(eq(comment.projectId, projectId), isNotNull(comment.deliverableId)))
      .orderBy(asc(comment.createdAt)),
    db
      .select({ id: contract.id, fileName: contract.fileName })
      .from(contract)
      .where(and(eq(contract.projectId, projectId), eq(contract.status, "signed")))
      .orderBy(desc(contract.createdAt))
      .limit(1)
      .then((res) => res[0] || null),
  ]);

  if (deliverablesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-muted/20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="rounded-xl bg-muted/50 p-4 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <svg className="h-7 w-7 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold tracking-tight" style={{ textWrap: 'balance' }}>No Deliverables Yet</h3>
        <p className="text-muted-foreground mt-1.5 max-w-sm text-[13px] leading-relaxed" style={{ textWrap: 'pretty' }}>
          {role === 'owner' || role === 'agency'
            ? "Create your first deliverable to start tracking progress with your client." 
            : "The project owner hasn't added any deliverables yet."}
        </p>
      </div>
    );
  }

  const scopeEvaluationsRecord: Record<string, ScopeEvaluation> = {};
  if (activeContract) {
    await Promise.all(
      deliverablesList.map(async (d) => {
        scopeEvaluationsRecord[d.id] = await evaluateDeliverableScope(projectId, d.title, d.description);
      })
    );
  }

  return (
    <DeliverablesContainer 
      deliverables={deliverablesList}
      allComments={allComments}
      memberRole={role as any}
      projectId={projectId}
      userId={userId}
      scopeEvaluations={scopeEvaluationsRecord}
      contractId={activeContract?.id}
    />
  );
}

async function DeliverablesHeaderAction({ projectId }: { projectId: string }) {
  const access = await getProjectAccess(projectId);
  if (access.role !== "owner" && access.role !== "agency") return null;
  return <CreateDeliverableDialog projectId={projectId} />;
}

export default async function DeliverablesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance">
            Deliverables
          </h1>
        </div>

        <Suspense fallback={null}>
          <DeliverablesHeaderAction projectId={projectId} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
        <DeliverablesData projectId={projectId} />
      </Suspense>
    </div>
  );
}
