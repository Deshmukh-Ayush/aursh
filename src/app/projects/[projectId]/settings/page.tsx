import { db } from "@/utils/db";
import { projectMember, project, user, projectInvitation } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DeleteProjectButton } from "@/components/projects/settings/delete-project-button";
import { GeneralSettings } from "@/components/projects/settings/general-settings";
import { MembersManager } from "@/components/projects/settings/members-manager";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return redirect("/sign-in");

  const [proj] = await db.select().from(project).where(eq(project.id, projectId));
  if (!proj) return redirect("/dashboard");

  let role: "agency" | "client" | "owner" | null = null;
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));

  if (member) {
    role = member.role as "agency" | "client" | "owner";
  } else if (session.session?.activeOrganizationId === proj.organizationId) {
    role = "agency";
  }

  if (!role) return redirect("/dashboard");

  // Fetch all members for this project
  const membersData = await db
    .select({
      id: projectMember.id,
      userId: projectMember.userId,
      role: projectMember.role,
      createdAt: projectMember.createdAt,
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
      }
    })
    .from(projectMember)
    .leftJoin(user, eq(projectMember.userId, user.id))
    .where(eq(projectMember.projectId, projectId))
    .orderBy(desc(projectMember.role)); // naive order, owner usually first

  // Fetch pending invites
  const invitesData = await db
    .select()
    .from(projectInvitation)
    .where(and(eq(projectInvitation.projectId, projectId), eq(projectInvitation.status, "pending")));

  return (
    <div className="space-y-10 max-w-4xl mx-auto w-full pb-20">
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Project Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your project preferences, team access, and destructive actions.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-[14px] font-bold text-foreground tracking-tight uppercase px-1">General</h2>
        <GeneralSettings 
          projectId={projectId} 
          initialName={proj.name} 
          initialStatus={proj.status} 
          role={role} 
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-[14px] font-bold text-foreground tracking-tight uppercase px-1">Access & Members</h2>
        <MembersManager 
          projectId={projectId}
          members={membersData}
          invites={invitesData}
          role={role}
          currentUserId={session.user.id}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-[14px] font-bold text-destructive tracking-tight uppercase px-1">Danger Zone</h2>
        <Card className="border-destructive/30 shadow-sm overflow-hidden bg-destructive/[0.02]">
          <CardHeader className="bg-destructive/[0.05] border-b border-destructive/20 pb-4">
            <CardTitle className="text-base font-semibold text-destructive">Delete Project</CardTitle>
            <CardDescription className="text-destructive/80">
              Irreversible and destructive actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[13px] text-foreground/80 max-w-[500px]">
                  Permanently remove this project and all of its contents, including uploaded files and contracts. This action cannot be undone.
                </p>
              </div>
              <DeleteProjectButton projectId={projectId} role={role} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
