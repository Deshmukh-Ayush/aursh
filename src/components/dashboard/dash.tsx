import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { project, projectInvitation, projectMember, contract, deliverable, activityLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrgSelector } from "@/components/org-selector";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, AlertTriangle, FileSignature, CheckCircle2, LayoutDashboard } from "lucide-react";
import { ProjectRowMenu } from "@/components/dashboard/project-row-menu";

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

  // --- Process Stats ---
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalActiveProjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
                <FileSignature className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingSignatures}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{deliverablesAwaitingApproval}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedProjects}</div>
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
              <div className="flex flex-col border rounded-lg bg-card overflow-hidden">
                {agencyProjectsData.map((data, idx) => {
                  const proj = data.proj;
                  const latestInvite = data.invitations[0];
                  const latestContract = data.contracts[0];
                  
                  const totalDelivs = data.deliverables.length;
                  const approvedDelivs = data.deliverables.filter(d => d.status === 'approved').length;
                  const progressVal = totalDelivs === 0 ? 0 : Math.round((approvedDelivs / totalDelivs) * 100);

                  const lastActivity = data.activityLogs[0]?.createdAt || proj.updatedAt;

                  const draftContractId = latestContract?.status === 'draft' ? latestContract.id : undefined;

                  return (
                    <div key={proj.id} className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group ${idx !== agencyProjectsData.length - 1 ? 'border-b' : ''}`}>
                      
                      <Link href={`/projects/${proj.id}/contract`} className="flex items-center gap-6 flex-1 min-w-0 h-full">
                        {/* Name and Status Dot */}
                        <div className="flex items-center gap-2 w-48 shrink-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${proj.status === 'active' ? 'bg-green-500' : 'bg-muted'}`} />
                          <div className="font-semibold truncate">{proj.name}</div>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex items-center gap-2 w-56 shrink-0">
                          {latestInvite ? (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-muted capitalize">
                              Invite: {latestInvite.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-muted opacity-50">No Invite</Badge>
                          )}

                          {latestContract ? (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-muted capitalize">
                              Contract: {latestContract.status === 'signed' ? 'Signed' : 'Pending'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-muted opacity-50">No Contract</Badge>
                          )}
                        </div>

                        {/* Progress */}
                        <div className="flex-1 max-w-[200px] items-center gap-3 hidden sm:flex">
                          {totalDelivs === 0 ? (
                            <span className="text-xs text-muted-foreground italic">No deliverables yet</span>
                          ) : (
                            <>
                              <Progress value={progressVal} className="h-2" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {approvedDelivs}/{totalDelivs}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>

                      {/* Right side (Menu & Chevron) */}
                      <div className="flex items-center gap-2 shrink-0 pl-4">
                        <span className="text-sm text-muted-foreground hidden md:inline-block mr-2">
                          {getRelativeTime(lastActivity)}
                        </span>
                        <div>
                          <ProjectRowMenu 
                            projectId={proj.id} 
                            projectName={proj.name} 
                            draftContractId={draftContractId} 
                          />
                        </div>
                        <Link href={`/projects/${proj.id}/contract`}>
                          <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors ml-1" />
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
