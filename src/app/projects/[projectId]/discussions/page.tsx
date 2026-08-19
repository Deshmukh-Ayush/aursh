import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { comment, user } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";

export const metadata: Metadata = {
  title: "Discussions",
  description: "View and participate in project discussions and comment threads.",
};

async function DiscussionData({ projectId, userId, role }: { projectId: string, userId: string, role: string }) {
  const thread = await db
    .select({
      comment: comment,
      author: user
    })
    .from(comment)
    .leftJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.projectId, projectId), isNull(comment.deliverableId)))
    .orderBy(asc(comment.createdAt));

  return (
    <CommentThread 
      projectId={projectId} 
      comments={thread} 
      currentUserId={userId}
      currentUserRole={role as any}
      deliverableId={undefined}
    />
  );
}

export default async function DiscussionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await getCachedSession();
  
  // Use cached project access instead of manually querying member and project tables
  const { proj, role } = await getProjectAccess(projectId, session.user.id);

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] max-w-4xl mx-auto w-full relative">
      <div className="shrink-0 pb-6 border-b border-border/40 mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-foreground text-balance">Project Discussions</h2>
        <p className="text-[13px] text-muted-foreground mt-1 text-pretty">
          General updates, questions, and communication for {proj?.name || "this project"}.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
        <DiscussionData projectId={projectId} userId={session.user.id} role={role!} />
      </Suspense>
    </div>
  );
}
