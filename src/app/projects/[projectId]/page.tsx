import type { Metadata } from "next";
import { db } from "@/utils/db";
import { project, activityLog, user as userTable, proposal } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ContractBanner } from "@/components/projects/contract-banner";
import { ProjectOverviewHero } from "@/components/projects/overview/project-overview-hero";
import { ProjectOverviewAttention } from "@/components/projects/overview/project-overview-attention";
import { ProjectOverviewMomentumChart } from "@/components/projects/overview/project-overview-momentum-chart";
import { ProjectOverviewPipeline } from "@/components/projects/overview/project-overview-pipeline";
import { ProjectOverviewStatusChart } from "@/components/projects/overview/project-overview-status-chart";
import { ProjectOverviewTeam } from "@/components/projects/overview/project-overview-team";
import { ProjectOverviewActivity } from "@/components/projects/overview/project-overview-activity";
import { ProjectOverviewStagger } from "@/components/projects/overview/project-overview-stagger";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Overview",
  description: "Project overview with key metrics, activity, and deliverable progress.",
};

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const { projectId } = await params;

  // `async-parallel`: start independent queries concurrently
  const [proj, recentActivity] = await Promise.all([
    db.query.project.findFirst({
      where: eq(project.id, projectId),
      with: {
        members: { with: { user: true } },
        deliverables: { orderBy: (deliverables, { asc }) => [asc(deliverables.createdAt)] },
        files: true,
        contracts: true,
      },
    }),
    db
      .select({ log: activityLog, actor: userTable })
      .from(activityLog)
      .leftJoin(userTable, eq(activityLog.userId, userTable.id))
      .where(eq(activityLog.projectId, projectId))
      .orderBy(desc(activityLog.createdAt))
      .limit(8),
  ]);

  if (!proj) return <div>Project not found</div>;

  // Fetch latest accepted proposal (separate query to avoid over-fetching)
  const latestProposal = await db.query.proposal.findFirst({
    where: eq(proposal.projectId, projectId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  const currentUserMember = proj.members.find((m) => m.user.id === session.user.id);
  const userRole = currentUserMember?.role ?? "agency";
  const isOwner = userRole === "owner";

  // `js-combine-iterations`: single pass for all deliverable metrics
  let approvedCount = 0;
  let totalCount = proj.deliverables.length;
  const attentionItems: typeof proj.deliverables = [];
  let nextDeadline: { title: string; date: string } | null = null;
  const now = Date.now();

  for (const d of proj.deliverables) {
    if (d.status === "approved") approvedCount++;

    if (d.status === "in_review" || d.status === "revision_requested") {
      attentionItems.push(d);
    }

    if (d.dueDate) {
      const dueTime = new Date(d.dueDate).getTime();
      if (dueTime > now) {
        if (!nextDeadline || dueTime < new Date(nextDeadline.date).getTime()) {
          nextDeadline = { title: d.title, date: d.dueDate.toISOString() };
        }
      }
    }
  }

  const completionPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const canComplete = isOwner && proj.status !== "completed" && totalCount > 0 && approvedCount === totalCount;
  const daysActive = Math.max(1, Math.round((Date.now() - new Date(proj.createdAt).getTime()) / 86400000));

  const activeContract = proj.contracts[0];
  const contractStatus = activeContract ? (activeContract.status as "draft" | "pending_signature" | "signed") : "none";

  // `server-serialization`: serialize only what components need
  const serializedDeliverables = proj.deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    status: d.status as "pending" | "in_review" | "approved" | "revision_requested",
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    submissionTitle: d.submissionTitle,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  const serializedAttention = attentionItems.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    status: d.status as "pending" | "in_review" | "approved" | "revision_requested",
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    submissionTitle: d.submissionTitle,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  const serializedActivity = recentActivity.map((a) => ({
    log: {
      id: a.log.id,
      type: a.log.type,
      metadata: a.log.metadata as Record<string, any> | null,
      createdAt: a.log.createdAt.toISOString(),
    },
    actor: a.actor
      ? { id: a.actor.id, name: a.actor.name, image: a.actor.image }
      : null,
  }));

  const serializedProposal = latestProposal
    ? {
        id: latestProposal.id,
        title: latestProposal.title,
        price: latestProposal.price,
        currency: latestProposal.currency,
        status: latestProposal.status as "draft" | "sent" | "accepted" | "declined",
        acceptedAt: latestProposal.acceptedAt?.toISOString() ?? null,
        createdAt: latestProposal.createdAt.toISOString(),
      }
    : null;

  const serializedContract = activeContract
    ? {
        id: activeContract.id,
        status: activeContract.status,
        fileName: activeContract.fileName,
        createdAt: activeContract.createdAt.toISOString(),
      }
    : null;

  const serializedProject = {
    id: proj.id,
    name: proj.name,
    description: proj.description,
    status: proj.status,
    createdAt: proj.createdAt.toISOString(),
    members: proj.members.map((m) => ({
      id: m.id,
      role: m.role,
      user: {
        id: m.user.id,
        name: m.user.name,
        image: m.user.image,
        email: m.user.email,
      },
    })),
    deliverables: serializedDeliverables,
    contracts: serializedContract ? [serializedContract] : [],
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <ContractBanner
        projectId={projectId}
        status={contractStatus}
        role={userRole as "owner" | "client" | "agency"}
      />

      <ProjectOverviewStagger>
        {/* Level 1: KPIs */}
        <ProjectOverviewHero
          project={serializedProject}
          projectId={projectId}
          completionPct={completionPct}
          daysActive={daysActive}
          canComplete={canComplete}
          nextDeadline={nextDeadline}
          proposal={serializedProposal}
          contract={serializedContract}
          userRole={userRole}
        />

        {/* Level 2: Hero Chart (Momentum) */}
        <ProjectOverviewMomentumChart recentActivity={serializedActivity} />

        {/* Attention Row (Optional) */}
        {serializedAttention.length > 0 && (
          <ProjectOverviewAttention projectId={projectId} items={serializedAttention} />
        )}

        {/* Level 3: Breakdown (Donut + Pipeline) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ProjectOverviewStatusChart deliverables={serializedDeliverables} />
          <div className="lg:col-span-2">
            <ProjectOverviewPipeline projectId={projectId} deliverables={serializedDeliverables} />
          </div>
        </div>

        {/* Level 4: Details (Team + Activity) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <ProjectOverviewTeam members={serializedProject.members} />
          <ProjectOverviewActivity projectId={projectId} recentActivity={serializedActivity} />
        </div>
      </ProjectOverviewStagger>
    </div>
  );
}
