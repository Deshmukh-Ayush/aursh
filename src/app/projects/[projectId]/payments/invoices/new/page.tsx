import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectAccess, canManageProject } from "@/lib/project-auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/utils/db";
import { project, paymentMilestone } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NewInvoicePageClient } from "./new-invoice-client";

export const metadata: Metadata = {
  title: "Create Invoice",
  description: "Generate and customize a new branded client invoice.",
};

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ milestoneId?: string }>;
}

async function NewInvoiceData({
  projectId,
  milestoneId,
}: {
  projectId: string;
  milestoneId?: string;
}) {
  const access = await getProjectAccess(projectId);
  if (!access.isAuthorized || !canManageProject(access.role)) {
    redirect(`/projects/${projectId}/payments`);
  }

  const [targetProject] = await db
    .select({ id: project.id, name: project.name, currency: project.currency })
    .from(project)
    .where(eq(project.id, projectId));

  if (!targetProject) {
    notFound();
  }

  let initialMilestone: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    dueDate?: string | Date | null;
  } | null = null;

  if (milestoneId) {
    const [milestoneRow] = await db
      .select({
        id: paymentMilestone.id,
        title: paymentMilestone.title,
        amount: paymentMilestone.amount,
        currency: paymentMilestone.currency,
        dueDate: paymentMilestone.dueDate,
      })
      .from(paymentMilestone)
      .where(
        and(
          eq(paymentMilestone.id, milestoneId),
          eq(paymentMilestone.projectId, projectId)
        )
      );

    if (milestoneRow) {
      initialMilestone = milestoneRow;
    }
  }

  return (
    <NewInvoicePageClient
      projectId={projectId}
      projectName={targetProject.name}
      projectCurrency={targetProject.currency as "USD" | "INR"}
      initialMilestoneId={milestoneId || null}
      initialMilestone={initialMilestone}
    />
  );
}

export default async function NewInvoicePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { projectId } = resolvedParams;
  const milestoneId = resolvedSearchParams.milestoneId;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <NewInvoiceData projectId={projectId} milestoneId={milestoneId} />
      </Suspense>
    </div>
  );
}
