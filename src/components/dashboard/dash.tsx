import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { project, projectInvitation, projectMember, contract, deliverable, activityLog } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrgSelector } from "@/components/org-selector";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, AlertTriangle, FileSignature, CheckCircle2, LayoutDashboard, ArrowRight } from "lucide-react";
import { ProjectRowMenu } from "@/components/dashboard/project-row-menu";
import { format, subDays } from "date-fns";
import { ActivityChart } from "./activity-chart";
import { CompletionChart } from "./completion-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getRelativeTime(date: Date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, 'day');
  const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
  if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, 'hour');
  const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
  return rtf.format(minutesDifference, 'minute');
}

export const Dash = async () => {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const activeOrgId = session.session?.activeOrganizationId;

  // 1. Fetch Client Projects
  const clientProjectsData = await db
    .select({
      proj: project,
      member: projectMember,
    })
    .from(projectMember)
    .innerJoin(project, eq(projectMember.projectId, project.id))
    .where(and(eq(projectMember.userId, session.user.id), eq(projectMember.role, "client")));

  // 2. Fetch Agency Projects
  let agencyProjectsData: Array<{
    proj: typeof project.$inferSelect;
    invitations: Array<typeof projectInvitation.$inferSelect>;
    contracts: Array<typeof contract.$inferSelect>;
    deliverables: Array<typeof deliverable.$inferSelect>;
    activityLogs: Array<typeof activityLog.$inferSelect>;
  }> = [];

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
    
    agencyProjectsData = rawProjects.map(p => ({
      proj: {
        id: p.id,
        name: p.name,
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

  // --- Process Stats & Trends ---
  let activityData: { date: string; actions: number }[] = [];
  let newProjectsThisWeek = 0;
  let newProjectsLastWeek = 0;
  let newDeliverablesThisWeek = 0;
  
  if (activeOrgId) {
    const fourteenDaysAgo = subDays(new Date(), 14);
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get all activity for the org's projects
    const allOrgActivity = await db
      .select({ createdAt: activityLog.createdAt, type: activityLog.type })
      .from(activityLog)
      .innerJoin(project, eq(activityLog.projectId, project.id))
      .where(
        and(
          eq(project.organizationId, activeOrgId),
          gte(activityLog.createdAt, fourteenDaysAgo)
        )
      );

    // Build chart data
    activityData = Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      return {
        date: format(d, "MMM dd"),
        actions: 0,
      };
    });

    allOrgActivity.forEach((log) => {
      const logDate = format(log.createdAt, "MMM dd");
      const dayData = activityData.find((d) => d.date === logDate);
      if (dayData) {
        dayData.actions++;
      }
    });

    // Calculate KPI trends
    const activeProjectsList = agencyProjectsData.filter(p => p.proj.status === 'active');
    newProjectsThisWeek = activeProjectsList.filter(p => new Date(p.proj.createdAt) >= sevenDaysAgo).length;
    newProjectsLastWeek = activeProjectsList.filter(p => new Date(p.proj.createdAt) >= fourteenDaysAgo && new Date(p.proj.createdAt) < sevenDaysAgo).length;
    
    // Count deliverables created this week
    newDeliverablesThisWeek = allOrgActivity.filter(log => log.type === "deliverable_created" && new Date(log.createdAt) >= sevenDaysAgo).length;
  }

  const totalActiveProjects = agencyProjectsData.filter(p => p.proj.status === 'active').length;
  const pendingSignatures = agencyProjectsData.filter(p => p.contracts.some(c => c.status === 'pending_signature')).length;
  const deliverablesAwaitingApproval = agencyProjectsData.reduce((acc, p) => acc + p.deliverables.filter(d => d.status === 'in_review').length, 0);
  const completedProjects = agencyProjectsData.filter(p => p.proj.status === 'completed').length;

  // --- Process Needs Attention ---
  const needsAttention: Array<{ id: string, projectId: string; projectName: string; message: string; href: string }> = [];
  agencyProjectsData.forEach(p => {
    if (p.contracts.some(c => c.status === 'draft' || c.status === 'pending_signature')) {
      needsAttention.push({ id: `c-${p.proj.id}`, projectId: p.proj.id, projectName: p.proj.name, message: "Contract unsigned", href: `/projects/${p.proj.id}/contract` });
    }
    const inReviewCount = p.deliverables.filter(d => d.status === 'in_review').length;
    if (inReviewCount > 0) {
      needsAttention.push({ id: `d-${p.proj.id}`, projectId: p.proj.id, projectName: p.proj.name, message: `${inReviewCount} deliverable(s) awaiting approval`, href: `/projects/${p.proj.id}/deliverables` });
    }
    if (p.invitations.some(i => i.status === 'pending')) {
      needsAttention.push({ id: `i-${p.proj.id}`, projectId: p.proj.id, projectName: p.proj.name, message: "Client invite pending", href: `/projects/${p.proj.id}` });
    }
  });

  return (
    <div className="flex flex-col min-h-svh p-4 md:p-8 gap-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspaces and client collaboration.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SignOutButton />
          {activeOrgId && (
            <>
              <WorkspaceSwitcher activeOrgId={activeOrgId} />
              <Link href="/dashboard/settings">
                <Button variant="outline">Settings</Button>
              </Link>
              <CreateProjectDialog />
            </>
          )}
        </div>
      </div>

      {/* --- CLIENT VIEW --- */}
      {clientProjectsData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Projects You're Invited To</h2>
          <ActivityChart data={activityData} />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            {clientProjectsData.map(({ proj }) => (
              <Link key={proj.id} href={`/projects/${proj.id}/contract`} className="transition-transform hover:-translate-y-1 block h-full">
                <Card className="flex flex-col h-full cursor-pointer shadow-sm hover:shadow-md border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{proj.name}</CardTitle>
                      <Badge variant="outline" className="bg-primary/5">Client</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 border-t">
                    <span className="text-sm font-medium text-primary">Open Workspace →</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- AGENCY VIEW --- */}
      {!activeOrgId && (
        <div className="rounded-xl border p-8 md:p-12 text-center bg-muted/20">
          <p className="text-muted-foreground mb-4">You need an active organization to manage and create your own agency projects.</p>
          <OrgSelector />
        </div>
      )}

      {activeOrgId && (
        <div className="space-y-8 mt-2">
          
          {/* STAT BAR */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">{totalActiveProjects}</div>
                {newProjectsThisWeek > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    +{newProjectsThisWeek} this week
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
                <FileSignature className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">{pendingSignatures}</div>
              </CardContent>
            </Card>
            <CompletionChart projects={agencyProjectsData} />
            <Card className="shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">{completedProjects}</div>
              </CardContent>
            </Card>
          </div>


          {/* NEEDS ATTENTION */}
          {needsAttention.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Needs Attention</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {needsAttention.map(item => (
                  <Link key={item.id} href={item.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold">{item.projectName}</span>
                        <span className="opacity-80"> — {item.message}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT LIST */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">My Agency Workspace</h3>
            {agencyProjectsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">No agency projects yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Create your first project to start collaborating with your clients.
                </p>
              </div>
            ) : (
              <div className="rounded-md border shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-card overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[300px]">Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deliverables</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agencyProjectsData.map((data) => {
                      const proj = data.proj;
                      const latestInvite = data.invitations[0];
                      const latestContract = data.contracts[0];
                      
                      const hasAcceptedClient = data.invitations.some(i => i.status === 'accepted');
                      const isContractSigned = latestContract?.status === 'signed';
                      
                      let statusBadge = <Badge variant="secondary" className="capitalize">{proj.status}</Badge>;
                      if (proj.status === 'active') {
                        if (!hasAcceptedClient && latestInvite?.status === 'pending') {
                          statusBadge = <Badge variant="outline" className="text-amber-600 border-amber-600/30">Invited</Badge>;
                        } else if (hasAcceptedClient && !isContractSigned && latestContract?.status === 'pending_signature') {
                          statusBadge = <Badge variant="outline" className="text-blue-600 border-blue-600/30">Waiting on Contract</Badge>;
                        } else {
                          statusBadge = (
                            <div className="flex items-center gap-1.5 w-fit text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Active
                            </div>
                          );
                        }
                      }

                      const totalDeliv = data.deliverables.length;
                      const approvedDeliv = data.deliverables.filter(d => d.status === 'approved').length;
                      const progress = totalDeliv === 0 ? 0 : Math.round((approvedDeliv / totalDeliv) * 100);

                      const lastLog = data.activityLogs[0];
                      const lastActiveText = lastLog ? getRelativeTime(new Date(lastLog.createdAt)) : "No activity";
                      const draftContractId = latestContract?.status === 'draft' ? latestContract.id : undefined;

                      return (
                        <TableRow key={proj.id} className="group hover:bg-muted/30 cursor-pointer transition-colors">
                          <TableCell className="font-medium">
                            <Link href={`/projects/${proj.id}`} className="flex items-center gap-2 hover:underline decoration-primary/30 underline-offset-4">
                              {proj.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`bg-secondary/50 font-medium ${
                              proj.status === 'active' ? 'text-primary' : 
                              proj.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground'
                            }`}>
                              {proj.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5 w-[140px]">
                              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                                <span>{approvedDeliv} / {totalDeliv}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={progress} className={`h-1.5 ${totalDeliv === 0 ? 'opacity-30' : ''}`} />
                                <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lastActiveText}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Link href={`/projects/${proj.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                              <ProjectRowMenu 
                                projectId={proj.id} 
                                projectName={proj.name}
                                draftContractId={draftContractId}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* ACTIVITY CHART */}
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
