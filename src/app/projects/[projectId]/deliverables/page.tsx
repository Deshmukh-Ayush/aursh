import { db } from "@/utils/db";
import { deliverable, projectMember, comment, user } from "@/db/schema";
import { eq, and, desc, isNotNull, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateDeliverableDialog } from "../../../../components/projects/deliverables/create-deliverable-dialog";
import { DeliverablesContainer } from "@/components/projects/deliverables/deliverables-container";

export default async function DeliverablesPage({ params }: { params: Promise<{ projectId: string }> }) {
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

  const deliverablesList = await db
    .select()
    .from(deliverable)
    .where(eq(deliverable.projectId, projectId))
    .orderBy(desc(deliverable.createdAt));

  const allComments = await db
    .select({
      comment: comment,
      author: user
    })
    .from(comment)
    .leftJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.projectId, projectId), isNotNull(comment.deliverableId)))
    .orderBy(asc(comment.createdAt));



  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ textWrap: 'balance' }}>Deliverables</h2>
          <p className="text-muted-foreground mt-1 text-[14px]" style={{ textWrap: 'pretty' }}>Track project tasks, milestones, and approvals.</p>
        </div>
        {member.role === 'owner' && (
          <CreateDeliverableDialog projectId={projectId} />
        )}
      </div>

      {deliverablesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-muted/20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="rounded-xl bg-muted/50 p-4 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <svg className="h-7 w-7 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-tight" style={{ textWrap: 'balance' }}>No Deliverables Yet</h3>
          <p className="text-muted-foreground mt-1.5 max-w-sm text-[13px] leading-relaxed" style={{ textWrap: 'pretty' }}>
            {member.role === 'owner' 
              ? "Create your first deliverable to start tracking progress with your client." 
              : "The project owner hasn't added any deliverables yet."}
          </p>
        </div>
      ) : (
        <DeliverablesContainer 
          deliverables={deliverablesList}
          allComments={allComments}
          memberRole={member.role}
          projectId={projectId}
          userId={userId}
        />
      )}
    </div>
  );
}
