"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliverableActions } from "./deliverable-actions";
import { Calendar, Clock, MessageSquare } from "lucide-react";
import { format, isPast } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CommentThread } from "@/components/projects/discussions/comment-thread";

export function DeliverableList({ 
  deliverables, 
  allComments, 
  memberRole, 
  projectId,
  userId
}: { 
  deliverables: any[];
  allComments: any[];
  memberRole: string;
  projectId: string;
  userId: string;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-none font-medium">Approved</Badge>;
      case 'in_review': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15 shadow-none font-medium">In Review</Badge>;
      case 'revision_requested': return <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/15 shadow-none font-medium">Needs Revision</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground shadow-none font-medium">Pending</Badge>;
    }
  };

  return (
    <div className="grid gap-3 w-full">
      <Accordion type="multiple" className="w-full space-y-3">
      {deliverables.map((deliv, index) => {
        const isOverdue = deliv.dueDate && isPast(new Date(deliv.dueDate)) && deliv.status !== 'approved';
        const delivComments = allComments.filter(c => c.comment.deliverableId === deliv.id);
        
        return (
          <Card 
            key={deliv.id} 
            className="shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] border-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)] transition-shadow"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CardTitle className="text-base font-semibold tracking-tight text-wrap-balance">{deliv.title}</CardTitle>
                  {getStatusBadge(deliv.status)}
                </div>
                {deliv.description && (
                  <CardDescription className="max-w-2xl text-[13px] leading-relaxed text-wrap-pretty">
                    {deliv.description}
                  </CardDescription>
                )}
              </div>
              <div className="shrink-0">
                <DeliverableActions 
                  deliverableId={deliv.id} 
                  status={deliv.status} 
                  role={memberRole} 
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">{format(new Date(deliv.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {deliv.dueDate && (
                <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="tabular-nums">
                    {format(new Date(deliv.dueDate), 'MMM d, yyyy')}
                    {isOverdue && ' · Overdue'}
                  </span>
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-2">
              <AccordionItem value={deliv.id} className="border-none">
                <AccordionTrigger className="py-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:no-underline transition-colors">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{delivComments.length}</span>
                    <span>{delivComments.length === 1 ? 'Comment' : 'Comments'}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 h-[400px] flex flex-col">
                    <CommentThread 
                      projectId={projectId}
                      deliverableId={deliv.id}
                      comments={delivComments}
                      currentUserId={userId}
                      currentUserRole={memberRole}
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
  );
}
