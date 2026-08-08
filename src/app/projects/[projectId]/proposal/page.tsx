import type { Metadata } from "next";
import { db } from "@/utils/db";
import { proposal, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProposalDashboardClient } from "@/components/projects/proposal/proposal-dashboard-client";
import { getProjectAccess } from "@/lib/project-auth";

export const metadata: Metadata = {
  title: "Proposals & Scope Estimates",
  description: "Create, review, and manage project proposals and scope estimates.",
};

export default async function ProposalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const userId = session.user.id;

  const { proj, role, isAuthorized } = await getProjectAccess(projectId, userId);
  if (!isAuthorized || !proj || !role) return redirect("/dashboard");

  // Fetch all proposals for this project with line items
  const existingProposals = await db.query.proposal.findMany({
    where: eq(proposal.projectId, projectId),
    with: { lineItems: { orderBy: (lineItems, { asc }) => [asc(lineItems.sortOrder)] } },
    orderBy: (proposal, { desc }) => [desc(proposal.createdAt)],
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <ProposalDashboardClient projectId={projectId} proposals={existingProposals} role={role} />
    </div>
  );
}
