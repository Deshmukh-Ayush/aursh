import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { projectMember, user, projectInvitation } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DeleteProjectButton } from "@/components/projects/settings/delete-project-button";
import { GeneralSettings } from "@/components/projects/settings/general-settings";
import { MembersManager } from "@/components/projects/settings/members-manager";
import { SettingsTabs } from "@/components/projects/settings/settings-tabs";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";

async function GeneralTabSection({ projectId }: { projectId: string }) {
  const access = await getProjectAccess(projectId);
  const proj = access.proj;
  const role = access.role || "agency";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[16px] font-semibold text-foreground tracking-tight">General Information</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Update your project's core details.</p>
      </div>
      <GeneralSettings 
        projectId={projectId} 
        initialName={proj?.name || ""} 
        initialDescription={proj?.description || ""}
        initialStatus={proj?.status || "active"} 
        role={role} 
      />
    </div>
  );
}

async function MembersData({ projectId }: { projectId: string }) {
  const [session, access, membersData, invitesData] = await Promise.all([
    getCachedSession(),
    getProjectAccess(projectId),
    db
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
      .orderBy(desc(projectMember.role)),
    db
      .select()
      .from(projectInvitation)
      .where(and(eq(projectInvitation.projectId, projectId), eq(projectInvitation.status, "pending")))
  ]);

  return (
    <MembersManager 
      projectId={projectId}
      members={membersData}
      invites={invitesData}
      role={(access.role || "agency") as any}
      currentUserId={session.user.id}
    />
  );
}

async function AdvancedTabSection({ projectId }: { projectId: string }) {
  const access = await getProjectAccess(projectId);
  const role = access.role || "agency";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[16px] font-semibold text-foreground tracking-tight">Advanced Settings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Irreversible and destructive actions.</p>
      </div>
      <Card className="border-destructive/20 shadow-sm overflow-hidden bg-destructive/[0.02]">
        <CardHeader className="bg-destructive/[0.04] border-b border-destructive/10 pb-4 pt-5 px-6">
          <CardTitle className="text-[15px] font-semibold text-destructive">Delete Project</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-[13px] text-foreground/80 max-w-[500px] leading-relaxed">
                Permanently remove this project and all of its contents, including uploaded files and contracts. 
                <br/><strong className="font-semibold text-destructive/90">This action cannot be undone.</strong>
              </p>
            </div>
            <DeleteProjectButton projectId={projectId} role={role} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 px-4 md:px-8">
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Project Settings</h1>
        <p className="text-[14px] text-muted-foreground mt-1.5">
          Manage your project preferences, team access, and destructive actions.
        </p>
      </div>

      <SettingsTabs>
        <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
          <GeneralTabSection projectId={projectId} />
        </Suspense>

        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground tracking-tight">Access & Members</h2>
            <p className="text-[13px] text-muted-foreground mt-1">Manage who has access to this project.</p>
          </div>
          <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
            <MembersData projectId={projectId} />
          </Suspense>
        </div>

        <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
          <AdvancedTabSection projectId={projectId} />
        </Suspense>
      </SettingsTabs>
    </div>
  );
}
