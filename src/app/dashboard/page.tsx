import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { project, projectInvitation } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const activeOrgId = session.session.activeOrganizationId;

  let projectsData: Array<{ proj: typeof project.$inferSelect, inv: typeof projectInvitation.$inferSelect | null }> = [];

  if (activeOrgId) {
    // Fetch projects for the active organization
    const result = await db
      .select({
        proj: project,
        inv: projectInvitation,
      })
      .from(project)
      .leftJoin(projectInvitation, eq(project.id, projectInvitation.projectId))
      .where(eq(project.organizationId, activeOrgId));
      
    projectsData = result;
  }

  return (
    <div className="flex flex-col min-h-svh p-8 gap-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client projects and workspace.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SignOutButton />
          {activeOrgId && <CreateProjectDialog />}
        </div>
      </div>

      {!activeOrgId && (
        <div className="rounded-md border p-8 text-center bg-muted/20">
          <p className="text-muted-foreground mb-4">You need an active organization to manage projects.</p>
          <Badge variant="outline" className="px-4 py-1 text-sm">Please select or create an organization</Badge>
        </div>
      )}

      {activeOrgId && projectsData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Create your first project to start collaborating with your clients.
          </p>
        </div>
      )}

      {activeOrgId && projectsData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projectsData.map(({ proj, inv }) => (
            <Card key={proj.id} className="flex flex-col">
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
                  <Badge variant={inv?.status === "accepted" ? "default" : "outline"} className="capitalize text-xs">
                    {inv?.status || "None"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
