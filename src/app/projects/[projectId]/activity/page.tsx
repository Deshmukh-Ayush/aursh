import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { activityLog, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ActivityBarChart } from "@/components/projects/activity/activity-bar-chart";
import { ActivityLogClient } from "@/components/projects/activity/activity-log-client";

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View all project activity and audit log.",
};

async function ActivityData({ projectId }: { projectId: string }) {
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
    <>
      <ActivityBarChart logs={logs} />
      <ActivityLogClient logs={logs} />
    </>
  );
}

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight">
            Activity Log
          </h1>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
        <ActivityData projectId={projectId} />
      </Suspense>
    </div>
  );
}
