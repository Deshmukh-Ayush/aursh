import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import {
  project,
  projectMember,
  activityLog,
} from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { getTenantContext } from "@/lib/tenant-context";

import { ActivityChart } from "./activity-chart";
import { DashboardHeader } from "@/components/dashboard/dash/dash-header";
import { ClientProjects } from "@/components/dashboard/dash/client-projects";
import { StatsCards } from "@/components/dashboard/dash/stats-card";
import { NeedsAttention } from "@/components/dashboard/dash/need-attention";
import { EmptyWorkspace } from "@/components/dashboard/dash/empty-workspace";
import { ProjectTable } from "@/components/dashboard/dash/project-table";

import type {
  DashboardActivityPoint,
  DashboardAgencyProject,
  DashboardClientProject,
  DashboardNeedsAttentionItem,
  DashboardStats,
} from "@/types/dash-types";

export const Dash = async () => {
  const reqHeaders = await headers();
  const ctx = await getTenantContext(reqHeaders);

  if (ctx.error || !ctx.user) {
    redirect("/sign-in");
  }

  const activeOrgId = ctx.organizationId;

  const clientProjectsData = await db
    .select({
      proj: project,
      member: projectMember,
    })
    .from(projectMember)
    .innerJoin(project, eq(projectMember.projectId, project.id))
    .where(and(eq(projectMember.userId, ctx.user.id), eq(projectMember.role, "client")));

  const clientProjects: DashboardClientProject[] = clientProjectsData.map(({ proj }) => ({
    proj,
  }));

  let agencyProjectsData: DashboardAgencyProject[] = [];

  if (activeOrgId) {
    const rawProjects = await db.query.project.findMany({
      where: eq(project.organizationId, activeOrgId),
      with: {
        invitations: {
          orderBy: (inv, { desc }) => [desc(inv.createdAt)],
        },
        contracts: {
          orderBy: (c, { desc }) => [desc(c.createdAt)],
        },
        deliverables: true,
        activityLogs: {
          orderBy: (log, { desc }) => [desc(log.createdAt)],
          limit: 1,
        },
      },
    });

    agencyProjectsData = rawProjects.map((p) => ({
      proj: {
        id: p.id,
        name: p.name,
        description: p.description,
        organizationId: p.organizationId,
        status: p.status,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
      invitations: p.invitations,
      contracts: p.contracts,
      deliverables: p.deliverables,
      activityLogs: p.activityLogs,
    }));
  }

  let activityData: DashboardActivityPoint[] = [];
  let newProjectsThisWeek = 0;
  let newProjectsLastWeek = 0;
  let newDeliverablesThisWeek = 0;

  if (activeOrgId) {
    const fourteenDaysAgo = subDays(new Date(), 14);
    const sevenDaysAgo = subDays(new Date(), 7);

    const allOrgActivity = await db
      .select({ createdAt: activityLog.createdAt, type: activityLog.type })
      .from(activityLog)
      .innerJoin(project, eq(activityLog.projectId, project.id))
      .where(
        and(
          eq(project.organizationId, activeOrgId),
          gte(activityLog.createdAt, fourteenDaysAgo),
        ),
      );

    activityData = Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      return {
        date: format(d, "MMM dd"),
        actions: 0,
      };
    });

    allOrgActivity.forEach((log) => {
      const logDate = format(new Date(log.createdAt), "MMM dd");
      const dayData = activityData.find((d) => d.date === logDate);
      if (dayData) {
        dayData.actions++;
      }
    });

    const activeProjectsList = agencyProjectsData.filter(
      (p) => p.proj.status === "active",
    );

    newProjectsThisWeek = activeProjectsList.filter(
      (p) => new Date(p.proj.createdAt) >= sevenDaysAgo,
    ).length;

    newProjectsLastWeek = activeProjectsList.filter((p) => {
      const createdAt = new Date(p.proj.createdAt);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
    }).length;

    newDeliverablesThisWeek = allOrgActivity.filter(
      (log) =>
        log.type === "deliverable_created" &&
        new Date(log.createdAt) >= sevenDaysAgo,
    ).length;
  }

  const stats: DashboardStats = {
    totalActiveProjects: agencyProjectsData.filter((p) => p.proj.status === "active").length,
    pendingSignatures: agencyProjectsData.filter((p) =>
      p.contracts.some((c) => c.status === "pending_signature"),
    ).length,
    deliverablesAwaitingApproval: agencyProjectsData.reduce(
      (acc, p) => acc + p.deliverables.filter((d) => d.status === "in_review").length,
      0,
    ),
    completedProjects: agencyProjectsData.filter((p) => p.proj.status === "completed").length,
    newProjectsThisWeek,
    newProjectsLastWeek,
    newDeliverablesThisWeek,
  };

  const needsAttention: DashboardNeedsAttentionItem[] = [];

  agencyProjectsData.forEach((p) => {
    if (p.contracts.some((c) => c.status === "draft" || c.status === "pending_signature")) {
      needsAttention.push({
        id: `c-${p.proj.id}`,
        projectId: p.proj.id,
        projectName: p.proj.name,
        message: "Contract unsigned",
        href: `/projects/${p.proj.id}/contract`,
      });
    }

    const inReviewCount = p.deliverables.filter((d) => d.status === "in_review").length;
    if (inReviewCount > 0) {
      needsAttention.push({
        id: `d-${p.proj.id}`,
        projectId: p.proj.id,
        projectName: p.proj.name,
        message: `${inReviewCount} deliverable(s) awaiting approval`,
        href: `/projects/${p.proj.id}/deliverables`,
      });
    }

    if (p.invitations.some((i) => i.status === "pending")) {
      needsAttention.push({
        id: `i-${p.proj.id}`,
        projectId: p.proj.id,
        projectName: p.proj.name,
        message: "Client invite pending",
        href: `/projects/${p.proj.id}`,
      });
    }
  });

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 p-4 md:p-8">
      <DashboardHeader hasOrganization={Boolean(activeOrgId)} />

      <ClientProjects projects={clientProjects} activityData={activityData} />

      {!activeOrgId ? (
        <EmptyWorkspace hasOrganization={false} hasProjects={false} />
      ) : (
        <div className="mt-2 space-y-8">
          <StatsCards stats={stats} projects={agencyProjectsData} />

          <NeedsAttention items={needsAttention} />

          <div className="space-y-4">
            <h3 className="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Agency Projects
            </h3>

            <EmptyWorkspace
              hasOrganization={true}
              hasProjects={agencyProjectsData.length > 0}
            />

            <ProjectTable projects={agencyProjectsData} />
          </div>

          {activityData.length > 0 && (
            <div className="mt-8">
              <ActivityChart data={activityData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};