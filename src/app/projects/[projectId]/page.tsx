import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { project, activityLog, user as userTable, proposal } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ContractBanner } from "@/components/projects/contract-banner";
import { ProjectOnboardingStepper } from "@/components/projects/overview/project-onboarding-stepper";
import { ProjectOverviewHero } from "@/components/projects/overview/project-overview-hero";
import { ProjectOverviewAttention } from "@/components/projects/overview/project-overview-attention";
import { ProjectOverviewMomentumChart } from "@/components/projects/overview/project-overview-momentum-chart";
import { ProjectOverviewStatusChart } from "@/components/projects/overview/project-overview-status-chart";
import { ProjectOverviewPipeline } from "@/components/projects/overview/project-overview-pipeline";
import { ProjectOverviewTeam } from "@/components/projects/overview/project-overview-team";
import { ProjectOverviewActivity } from "@/components/projects/overview/project-overview-activity";
import { ProjectOverviewStagger } from "@/components/projects/overview/project-overview-stagger";
import { getProjectAccess } from "@/lib/project-auth";

export const metadata: Metadata = {
  title: "Overview",
  description: "Project overview with key metrics, activity, and deliverable progress.",
};

const getOverviewData = cache(async (projectId: string) => {
  const [proj, recentActivity, latestProposal] = await Promise.all([
    db.query.project.findFirst({
      where: eq(project.id, projectId),
      with: {
        members: { with: { user: true } },
        deliverables: { orderBy: (deliverables, { asc }) => [asc(deliverables.createdAt)] },
        contracts: { orderBy: (contracts, { desc }) => [desc(contracts.createdAt)] },
      },
    }),
    db
      .select({ log: activityLog, actor: userTable })
      .from(activityLog)
      .leftJoin(userTable, eq(activityLog.userId, userTable.id))
      .where(eq(activityLog.projectId, projectId))
      .orderBy(desc(activityLog.createdAt))
      .limit(8),
    db.query.proposal.findFirst({
      where: eq(proposal.projectId, projectId),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    })
  ]);
  return { proj, recentActivity, latestProposal };
});

async function ProjectOverviewHeader({ projectId }: { projectId: string }) {
  const [access, { proj, latestProposal }] = await Promise.all([
    getProjectAccess(projectId),
    getOverviewData(projectId),
  ]);
  if (!proj) return null;
  const userRole = access.role || "agency";

  const totalCount = proj.deliverables.length;
  const activeContract = proj.contracts[0];
  const contractStatus = activeContract ? (activeContract.status as "draft" | "pending_signature" | "signed") : "none";

  return (
    <>
      <ProjectOnboardingStepper
        projectId={projectId}
        hasProposal={!!latestProposal}
        hasContract={!!activeContract}
        hasDeliverables={totalCount > 0}
        userRole={userRole}
      />
      <ContractBanner
        projectId={projectId}
        status={contractStatus}
        role={userRole as "owner" | "client" | "agency"}
      />
    </>
  );
}

async function ProjectOverviewHeroSection({ projectId }: { projectId: string }) {
  const [access, { proj, latestProposal }] = await Promise.all([
    getProjectAccess(projectId),
    getOverviewData(projectId),
  ]);
  if (!proj) return null;
  const userRole = access.role || "agency";

  let approvedCount = 0;
  const totalCount = proj.deliverables.length;
  let nextDeadline: { title: string; date: string } | null = null;
  const now = Date.now();

  for (const d of proj.deliverables) {
    if (d.status === "approved") approvedCount++;
    if (d.dueDate) {
      const dueTime = new Date(d.dueDate).getTime();
      if (dueTime > now && (!nextDeadline || dueTime < new Date(nextDeadline.date).getTime())) {
        nextDeadline = { title: d.title, date: d.dueDate.toISOString() };
      }
    }
  }

  const completionPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const isOwner = userRole === "owner";
  const canComplete = isOwner && proj.status !== "completed" && totalCount > 0 && approvedCount === totalCount;
  const daysActive = Math.max(1, Math.round((Date.now() - new Date(proj.createdAt).getTime()) / 86400000));
  const activeContract = proj.contracts[0];

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
    deliverables: [], // Not needed for hero
    contracts: serializedContract ? [serializedContract] : [],
  };

  return (
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
  );
}

async function ProjectOverviewMomentumSection({ projectId }: { projectId: string }) {
  const { recentActivity } = await getOverviewData(projectId);
  
  const serializedActivity = recentActivity.map((a) => ({
    log: {
      id: a.log.id,
      type: a.log.type,
      metadata: a.log.metadata as Record<string, any> | null,
      createdAt: a.log.createdAt.toISOString(),
    },
    actor: a.actor ? { id: a.actor.id, name: a.actor.name, image: a.actor.image } : null,
  }));

  return <ProjectOverviewMomentumChart recentActivity={serializedActivity} />;
}

async function ProjectOverviewBreakdownSection({ projectId }: { projectId: string }) {
  const { proj } = await getOverviewData(projectId);
  if (!proj) return null;

  const attentionItems = proj.deliverables.filter(d => d.status === "in_review" || d.status === "revision_requested");

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

  return (
    <>
      {serializedAttention.length > 0 && (
        <ProjectOverviewAttention projectId={projectId} items={serializedAttention} />
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProjectOverviewStatusChart deliverables={serializedDeliverables} />
        <div className="lg:col-span-2">
          <ProjectOverviewPipeline projectId={projectId} deliverables={serializedDeliverables} />
        </div>
      </div>
    </>
  );
}

async function ProjectOverviewDetailsSection({ projectId }: { projectId: string }) {
  const { proj, recentActivity } = await getOverviewData(projectId);
  if (!proj) return null;

  const serializedActivity = recentActivity.map((a) => ({
    log: {
      id: a.log.id,
      type: a.log.type,
      metadata: a.log.metadata as Record<string, any> | null,
      createdAt: a.log.createdAt.toISOString(),
    },
    actor: a.actor ? { id: a.actor.id, name: a.actor.name, image: a.actor.image } : null,
  }));

  const serializedMembers = proj.members.map((m) => ({
    id: m.id,
    role: m.role,
    user: {
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      email: m.user.email,
    },
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <ProjectOverviewTeam members={serializedMembers} />
      <ProjectOverviewActivity projectId={projectId} recentActivity={serializedActivity} />
    </div>
  );
}

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Suspense fallback={<Skeleton className="h-20 w-full rounded-xl" />}>
        <ProjectOverviewHeader projectId={projectId} />
      </Suspense>

      <ProjectOverviewStagger>
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
          <ProjectOverviewHeroSection projectId={projectId} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
          <ProjectOverviewMomentumSection projectId={projectId} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-xl" />}>
          <ProjectOverviewBreakdownSection projectId={projectId} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
          <ProjectOverviewDetailsSection projectId={projectId} />
        </Suspense>
      </ProjectOverviewStagger>
    </div>
  );
}
