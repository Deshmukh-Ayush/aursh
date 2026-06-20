import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { project, projectInvitation, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrgSelector } from "@/components/org-selector";
import { ResendInviteButton } from "@/components/resend-invite-button";

export default async function DashboardPage() {
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
  let agencyProjectsData: Array<{ proj: typeof project.$inferSelect, inv: typeof projectInvitation.$inferSelect | null }> = [];

  if (activeOrgId) {
    agencyProjectsData = await db
      .select({
        proj: project,
        inv: projectInvitation,
      })
      .from(project)
      .leftJoin(projectInvitation, eq(project.id, projectInvitation.projectId))
      .where(eq(project.organizationId, activeOrgId));
  }

  return (
    <div className="flex flex-col min-h-svh p-4 md:p-8 gap-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
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
                    <CardDescription>Created on {new Date(proj.createdAt).toLocaleDateString()}</CardDescription>
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
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold border-b pb-2">My Agency Workspace</h2>
        
        {!activeOrgId && (
          <div className="rounded-xl border p-8 md:p-12 text-center bg-muted/20">
            <p className="text-muted-foreground mb-4">You need an active organization to manage and create your own agency projects.</p>
            <OrgSelector />
          </div>
        )}

        {activeOrgId && agencyProjectsData.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">No agency projects yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Create your first project to start collaborating with your clients.
            </p>
          </div>
        )}

        {activeOrgId && agencyProjectsData.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agencyProjectsData.map(({ proj, inv }) => (
              <Link key={proj.id} href={`/projects/${proj.id}/contract`} className="transition-transform hover:-translate-y-1 block h-full">
                <Card className="flex flex-col h-full cursor-pointer shadow-sm hover:shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{proj.name}</CardTitle>
                      <Badge variant={proj.status === "active" ? "default" : "secondary"}>
                        {proj.status}
                      </Badge>
                    </div>
                    <CardDescription>Created on {new Date(proj.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Client Invite</span>
                      <div className="flex items-center gap-2">
                        {inv?.status === "pending" && (
                          <ResendInviteButton projectId={proj.id} />
                        )}
                        <Badge variant={inv?.status === "accepted" ? "default" : "outline"} className="capitalize text-xs">
                          {inv?.status || "None"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
