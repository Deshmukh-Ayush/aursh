import { db } from "@/utils/db";
import { comment, user, projectMember } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CommentThread } from "@/components/projects/discussions/comment-thread";

export default async function DiscussionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const { projectId } = await params;
  const userId = session.user.id;

  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

  if (!member) return null;

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
    <div className="flex flex-col h-[calc(100svh-4rem)] md:h-[calc(100svh-4rem)] max-w-4xl mx-auto w-full">
      <div className="mb-6 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Discussions</h2>
        <p className="text-muted-foreground mt-1">General project discussion and updates.</p>
      </div>

      <CommentThread 
        projectId={projectId} 
        comments={thread} 
        currentUserId={userId}
        currentUserRole={member.role}
        deliverableId={undefined}
      />
    </div>
  );
}
