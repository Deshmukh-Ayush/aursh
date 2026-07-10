import { db } from "@/utils/db";
import { comment, user, projectMember, project } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { redirect } from "next/navigation";

export default async function DiscussionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return redirect("/sign-in");

  const { projectId } = await params;
  const userId = session.user.id;

  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

  if (!member) return redirect("/dashboard");

  const [proj] = await db.select().from(project).where(eq(project.id, projectId));

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
    <div className="flex flex-col h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] max-w-4xl mx-auto w-full relative">
      <div className="shrink-0 pb-6 border-b border-border/40 mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-foreground text-balance">Project Discussions</h2>
        <p className="text-[13px] text-muted-foreground mt-1 text-pretty">
          General updates, questions, and communication for {proj?.name || "this project"}.
        </p>
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
