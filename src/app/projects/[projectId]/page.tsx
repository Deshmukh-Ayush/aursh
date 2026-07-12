import { db } from "@/utils/db";
import { project, activityLog, user as userTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ContractBanner } from "@/components/projects/contract-banner";
import { ProjectOverviewActivity } from "@/components/projects/overview/project-overview-activity";
import { ProjectOverviewHeader } from "@/components/projects/overview/project-overview-header";
import { ProjectOverviewKpis } from "@/components/projects/overview/project-overview-kpis";
import { ProjectOverviewLinks } from "@/components/projects/overview/project-overview-links";
import { ProjectOverviewProgress } from "@/components/projects/overview/project-overview-progress";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const { projectId } = await params;

  // Fetch Project with all necessary relations
  const proj = await db.query.project.findFirst({
    where: eq(project.id, projectId),
    with: {
      members: {
        with: {
          user: true,
        }
      },
      deliverables: {
        orderBy: (deliverables, { asc }) => [asc(deliverables.createdAt)]
      },
      files: true,
      contracts: true,
    }
  });

  if (!proj) return <div>Project not found</div>;

  // Fetch recent activity
  const recentActivity = await db
    .select({ log: activityLog, actor: userTable })
    .from(activityLog)
    .leftJoin(userTable, eq(activityLog.userId, userTable.id))
    .where(eq(activityLog.projectId, projectId))
    .orderBy(desc(activityLog.createdAt))
    .limit(5);

  const currentUserMember = proj.members.find(m => m.user.id === session.user.id);
  const isOwner = currentUserMember?.role === 'owner';

  const totalDelivs = proj.deliverables.length;
  const approvedDelivs = proj.deliverables.filter(d => d.status === 'approved').length;
  const inReviewDelivs = proj.deliverables.filter(d => d.status === 'in_review').length;
  const revisionDelivs = proj.deliverables.filter(d => d.status === 'revision_requested').length;
  const pendingDelivs = totalDelivs - approvedDelivs - inReviewDelivs - revisionDelivs;
  const completionPct = totalDelivs > 0 ? Math.round((approvedDelivs / totalDelivs) * 100) : 0;

  const canComplete = isOwner && proj.status !== 'completed' && totalDelivs > 0 && approvedDelivs === totalDelivs;
  
  const daysActive = Math.max(1, Math.round((new Date().getTime() - new Date(proj.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  // Compute Area Chart Data
  const chartData = [];
  const startDate = new Date(proj.createdAt).getTime();
  const endDate = new Date().getTime();
  const totalDuration = Math.max(endDate - startDate, 1000 * 60 * 60 * 24 * 6);
  const numPoints = 7;
  const interval = totalDuration / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const pointDate = new Date(startDate + interval * i);
    let completedAtPoint = 0;
    
    proj.deliverables.forEach(d => {
       if (d.status === 'approved' && new Date(d.updatedAt).getTime() <= pointDate.getTime()) {
         completedAtPoint++;
       }
    });

    if (i === numPoints - 1) {
      completedAtPoint = approvedDelivs;
    }

    chartData.push({
      date: pointDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      completed: completedAtPoint,
      expected: totalDelivs
    });
  }

  const activeContract = proj.contracts[0];
  const contractStatus = activeContract ? activeContract.status as "draft" | "pending_signature" | "signed" : "none";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <ContractBanner
        projectId={projectId}
        status={contractStatus}
        role={currentUserMember?.role as "owner" | "client" | "agency"}
      />

      <ProjectOverviewHeader
        project={proj}
        projectId={projectId}
        canComplete={canComplete}
        daysActive={daysActive}
      />

      <ProjectOverviewKpis
        project={proj}
        completionPct={completionPct}
        approvedDelivs={approvedDelivs}
        totalDelivs={totalDelivs}
        contractStatus={contractStatus}
      />

      <ProjectOverviewProgress
        projectId={projectId}
        chartData={chartData}
        totalDelivs={totalDelivs}
        approvedDelivs={approvedDelivs}
        inReviewDelivs={inReviewDelivs}
        revisionDelivs={revisionDelivs}
        pendingDelivs={pendingDelivs}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ProjectOverviewLinks projectId={projectId} totalDelivs={totalDelivs} totalFiles={proj.files.length} />
        <ProjectOverviewActivity projectId={projectId} recentActivity={recentActivity} />
      </div>
    </div>
  );
}
