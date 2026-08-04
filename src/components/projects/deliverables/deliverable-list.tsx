"use client";

import { DeliverableActions } from "./deliverable-actions";
import { Calendar, Clock, MessageSquare, ExternalLink, Paperclip } from "lucide-react";
import { format, isPast } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { DeliverableItem } from "./types";

interface DeliverableListProps {
  deliverables: DeliverableItem[];
  allComments: any[];
  projectId: string;
  memberRole: string;
  userId: string;
}

export function DeliverableList({
  deliverables,
  allComments,
  memberRole,
  projectId,
  userId,
}: DeliverableListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            In Review
          </span>
        );
      case "revision_requested":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Needs Revision
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/40">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="grid gap-3 w-full">
      <Accordion type="multiple" className="w-full space-y-3">
        {deliverables.map((deliv, index) => {
          const isOverdue = deliv.dueDate && isPast(new Date(deliv.dueDate)) && deliv.status !== "approved";
          const delivComments = allComments.filter((c) => c.comment.deliverableId === deliv.id);

          return (
            <div
              key={deliv.id}
              className="bg-card border border-border/50 rounded-xl p-5 hover:border-border transition-all hover:shadow-md space-y-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{deliv.title}</h3>
                    {getStatusBadge(deliv.status)}
                  </div>
                  {deliv.description && (
                    <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{deliv.description}</p>
                  )}
                </div>

                <div className="shrink-0">
                  <DeliverableActions deliverableId={deliv.id} status={deliv.status} role={memberRole} />
                </div>
              </div>

              {/* Submission Information Pill if submitted */}
              {deliv.submissionTitle && (
                <div className="bg-muted/40 rounded-lg p-3 border border-border/30 space-y-1 text-xs">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-primary" /> Submitted Work: {deliv.submissionTitle}
                  </div>
                  {deliv.submissionNote && (
                    <p className="text-foreground/90 leading-relaxed text-xs">{deliv.submissionNote}</p>
                  )}
                  {deliv.submissionUrl && (
                    <a
                      href={deliv.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
                    >
                      View Attachment Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Metadata & Discussions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">
                      Created {format(new Date(deliv.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  {deliv.dueDate && (
                    <div
                      className={`flex items-center gap-1.5 ${
                        isOverdue ? "text-rose-400 font-semibold" : ""
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="tabular-nums">
                        Due {format(new Date(deliv.dueDate), "MMM d, yyyy")}
                        {isOverdue && " (Overdue)"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Accordion Comment Trigger */}
                <AccordionItem value={deliv.id} className="border-none">
                  <AccordionTrigger className="py-1 px-3 bg-muted/30 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline transition-colors active:scale-[0.96]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-semibold">{delivComments.length}</span>
                      <span>{delivComments.length === 1 ? "Comment" : "Comments"}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="h-[380px] flex flex-col bg-background/60 rounded-xl border border-border/30 p-3">
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
            </div>
          );
        })}
      </Accordion>
    </div>
  );
}
