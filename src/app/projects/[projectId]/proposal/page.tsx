import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { proposal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProposalDashboardClient } from "@/components/projects/proposal/proposal-dashboard-client";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";

export const metadata: Metadata = {
  title: "Proposals & Scope Estimates",
  description: "Create, review, and manage project proposals and scope estimates.",
};

async function ProposalData({ projectId }: { projectId: string }) {
  const session = await getCachedSession();
  const { role } = await getProjectAccess(projectId, session.user.id);

  // Fetch all proposals for this project with line items
  const existingProposals = await db.query.proposal.findMany({
    where: eq(proposal.projectId, projectId),
    with: { lineItems: { orderBy: (lineItems, { asc }) => [asc(lineItems.sortOrder)] } },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  return <ProposalDashboardClient projectId={projectId} proposals={existingProposals} role={role!} />;
}

export default async function ProposalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
        <ProposalData projectId={projectId} />
      </Suspense>
    </div>
  );
}
