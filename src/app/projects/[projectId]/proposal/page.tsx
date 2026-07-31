import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposal",
  description: "Create, review, and manage project proposals.",
};

import { db } from "@/utils/db";
import { proposal, projectMember } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProposalBuilder } from "../../../../components/projects/proposal/proposal-builder";
import { ProposalClientView } from "../../../../components/projects/proposal/proposal-client-view";

export default async function ProposalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const userId = session.user.id;

  // Check role
  const member = await db.select().from(projectMember).where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));
  const role = member[0]?.role || "agency"; // fallback to agency for org members

  // Fetch proposals
  const existingProposals = await db.query.proposal.findMany({
    where: eq(proposal.projectId, projectId),
    with: { lineItems: { orderBy: (lineItems, { asc }) => [asc(lineItems.sortOrder)] } },
    orderBy: (proposal, { desc }) => [desc(proposal.createdAt)],
  });

  const currentProposal = existingProposals[0]; // Most recent

  if (role === 'owner' || role === 'agency') {
    if (!currentProposal || currentProposal.status === 'draft') {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <ProposalBuilder projectId={projectId} initialData={currentProposal} />
        </div>
      );
    }
    
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
        <ProposalClientView proposal={currentProposal} role={role} />
      </div>
    );
  }

  // Client view
  if (!currentProposal || currentProposal.status === 'draft') {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-xl bg-muted/20 border-border/40 shadow-sm">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">No Proposal Yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">The project owner hasn't sent a proposal yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ProposalClientView proposal={currentProposal} role={role} />
    </div>
  );
}
