import { db } from "@/utils/db";
import { deliverable, projectMember, comment, user } from "@/db/schema";
import { eq, and, desc, isNotNull, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateDeliverableDialog } from "../../../../components/projects/deliverables/create-deliverable-dialog";
import { DeliverableActions } from "../../../../components/projects/deliverables/deliverable-actions";
import { Calendar, Clock, MessageSquare } from "lucide-react";
import { format, isPast } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CommentThread } from "@/components/projects/discussions/comment-thread";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
      case 'in_review': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">In Review</Badge>;
      case 'revision_requested': return <Badge variant="destructive">Revision Requested</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Deliverables</h2>
          <p className="text-muted-foreground mt-1">Track project tasks, milestones, and approvals.</p>
        </div>
        {member.role === 'owner' && (
          <CreateDeliverableDialog projectId={projectId} />
        )}
      </div>

      {deliverablesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-xl bg-background/50">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No Deliverables Yet</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            {member.role === 'owner' 
              ? "Create your first deliverable to start tracking progress with your client." 
              : "The project owner hasn't added any deliverables yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <Accordion type="multiple" className="w-full space-y-4">
          {deliverablesList.map((deliv) => {
            const isOverdue = deliv.dueDate && isPast(deliv.dueDate) && deliv.status !== 'approved';
            const delivComments = allComments.filter(c => c.comment.deliverableId === deliv.id);
            
            return (
              <Card key={deliv.id} className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{deliv.title}</CardTitle>
                      {getStatusBadge(deliv.status)}
                    </div>
                    {deliv.description && (
                      <CardDescription className="max-w-2xl text-sm leading-relaxed">
                        {deliv.description}
                      </CardDescription>
                    )}
                  </div>
                  <DeliverableActions 
                    deliverableId={deliv.id} 
                    status={deliv.status} 
                    role={member.role} 
                  />
                </CardHeader>
                <CardContent className="pt-0 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Created {format(deliv.createdAt, 'MMM d, yyyy')}
                  </div>
                  {deliv.dueDate && (
                    <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      Due {format(deliv.dueDate, 'MMM d, yyyy')}
                      {isOverdue && ' (Overdue)'}
                    </div>
                  )}
                </CardContent>
                <div className="px-6 pb-2">
                  <AccordionItem value={deliv.id} className="border-none">
                    <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground hover:no-underline">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {delivComments.length} {delivComments.length === 1 ? 'Comment' : 'Comments'}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 h-[400px] flex flex-col">
                        <CommentThread 
                          projectId={projectId}
                          deliverableId={deliv.id}
                          comments={delivComments}
                          currentUserId={userId}
                          currentUserRole={member.role}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              </Card>
            )
          })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
