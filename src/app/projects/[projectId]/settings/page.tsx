import { db } from "@/utils/db";
import { project, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DeleteProjectButton } from "./delete-project-button";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your project preferences and destructive actions.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-destructive/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <h4 className="font-semibold text-foreground">Delete Project</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-[400px]">
                  Permanently remove this project and all of its contents, including uploaded files and contracts.
                </p>
              </div>
              <DeleteProjectButton projectId={projectId} role={member?.role || "client"} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
