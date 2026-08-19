import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { paymentMilestone, payment, deliverable } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { PaymentsViewClient, MilestoneWithDetails } from "@/components/projects/payments";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";

export const metadata: Metadata = {
  title: "Payments & Milestones",
  description: "Track project financials, payment milestones, and client checkout statuses.",
};

async function PaymentsData({ projectId }: { projectId: string }) {
  const session = await getCachedSession();
  const { role } = await getProjectAccess(projectId, session.user.id);

  const [milestonesData, paymentsData, deliverablesData] = await Promise.all([
    db.select().from(paymentMilestone).where(eq(paymentMilestone.projectId, projectId)).orderBy(asc(paymentMilestone.sortOrder), asc(paymentMilestone.createdAt)),
    db.select().from(payment).where(eq(payment.projectId, projectId)).orderBy(desc(payment.createdAt)),
    db.select().from(deliverable).where(eq(deliverable.projectId, projectId)).orderBy(asc(deliverable.createdAt)),
  ]);

  const deliverablesMap = new Map(deliverablesData.map((d) => [d.id, d.title]));

  const serializedMilestones: MilestoneWithDetails[] = milestonesData.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    proposalId: m.proposalId,
    deliverableId: m.deliverableId,
    deliverableTitle: m.deliverableId ? deliverablesMap.get(m.deliverableId) || null : null,
    title: m.title,
    description: m.description,
    amount: m.amount,
    currency: m.currency,
    triggerType: m.triggerType as any,
    dueDate: m.dueDate,
    status: m.status as any,
    createdAt: m.createdAt,
  }));

  const serializedPayments = paymentsData.map((p) => ({
    id: p.id,
    milestoneId: p.milestoneId,
    amount: p.amount,
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    status: p.status,
    paidAt: p.paidAt,
  }));

  const deliverablesList = deliverablesData.map((d) => ({
    id: d.id,
    title: d.title,
  }));

  return (
    <PaymentsViewClient
      projectId={projectId}
      milestones={serializedMilestones}
      payments={serializedPayments}
      currentUserId={session.user.id}
      userRole={role!}
      deliverablesList={deliverablesList}
    />
  );
}

export default async function PaymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <PaymentsData projectId={projectId} />
    </Suspense>
  );
}
