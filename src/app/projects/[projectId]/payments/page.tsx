import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Milestones",
  description: "Track project financials, payment milestones, and client checkout statuses.",
};

import { db } from "@/utils/db";
import { paymentMilestone, payment, projectMember, project, deliverable } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PaymentsViewClient, MilestoneWithDetails } from "@/components/projects/payments";

export default async function PaymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return redirect("/sign-in");

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const userId = session.user.id;

  // `async-parallel`: fetch member, project, milestones, payments, and deliverables concurrently
  const [memberRows, projRows, milestonesData, paymentsData, deliverablesData] = await Promise.all([
    db.select().from(projectMember).where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId))),
    db.select().from(project).where(eq(project.id, projectId)),
    db.select().from(paymentMilestone).where(eq(paymentMilestone.projectId, projectId)).orderBy(asc(paymentMilestone.sortOrder), asc(paymentMilestone.createdAt)),
    db.select().from(payment).where(eq(payment.projectId, projectId)).orderBy(desc(payment.createdAt)),
    db.select().from(deliverable).where(eq(deliverable.projectId, projectId)).orderBy(asc(deliverable.createdAt)),
  ]);

  const member = memberRows[0];
  const proj = projRows[0];

  if (!proj) return redirect("/dashboard");

  let role: "owner" | "agency" | "client" = "agency";
  if (member) {
    role = member.role as "owner" | "agency" | "client";
  } else if (session.session?.activeOrganizationId === proj.organizationId) {
    role = "agency";
  } else {
    return redirect("/dashboard");
  }

  // Join deliverable titles to milestones
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
      currentUserId={userId}
      userRole={role}
      deliverablesList={deliverablesList}
    />
  );
}
