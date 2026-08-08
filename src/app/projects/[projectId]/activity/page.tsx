import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View all project activity and audit log.",
};

import { db } from "@/utils/db";
import { activityLog, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityBarChart } from "@/components/projects/activity/activity-bar-chart";
import { ActivityLogClient } from "@/components/projects/activity/activity-log-client";
import { getProjectAccess } from "@/lib/project-auth";

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session || !session.user) return redirect("/sign-in");

  const { projectId } = await params;

  const { proj, isAuthorized } = await getProjectAccess(projectId, session.user.id);
  if (!isAuthorized || !proj) return redirect("/dashboard");

  const logs = await db
    .select({
      log: activityLog,
      actor: user,
    })
    .from(activityLog)
    .leftJoin(user, eq(activityLog.userId, user.id))
    .where(eq(activityLog.projectId, projectId))
    .orderBy(desc(activityLog.createdAt));

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight">
            Activity Log
          </h1>
        </div>
      </div>

      {/* EvilCharts Monospace Bar Chart Summary */}
      <ActivityBarChart logs={logs} />

      {/* Interactive Client Component: Audit Trail List with Category Filter & Search */}
      <ActivityLogClient logs={logs} />
    </div>
  );
}
