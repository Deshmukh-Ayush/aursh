"use client";

import { DeliverableActions } from "./deliverable-actions";
import { Clock, MessageSquare, ExternalLink, Paperclip, Zap } from "lucide-react";
import { format, isPast } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { DeliverableItem } from "./types";
import { motion } from "framer-motion";
import { SealCheckIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";

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
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          Icon: SealCheckIcon,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      case "in_review":
        return {
          label: "In Review",
          Icon: PaperPlaneTiltIcon,
          color: "text-sky-500",
          bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        };
      case "revision_requested":
        return {
          label: "Needs Revision",
          Icon: Zap,
          color: "text-rose-500 animate-pulse",
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        };
      default:
        return {
          label: "Pending",
          Icon: Clock,
          color: "text-purple-500",
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        };
    }
  };

  return (
    <div className="w-full">
      <Accordion type="multiple" className="w-full">
        {deliverables.map((deliv, index) => {
          const isOverdue = deliv.dueDate && isPast(new Date(deliv.dueDate)) && deliv.status !== "approved";
          const delivComments = allComments.filter((c) => c.comment.deliverableId === deliv.id);
          const statusConfig = getStatusConfig(deliv.status);
          const StatusIcon = statusConfig.Icon;

          return (
            <motion.div
              key={deliv.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: index * 0.02 }}
              className="border-b border-border/40 last:border-0 rounded-md"
            >
              <div className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/40 transition-colors rounded-md">
                {/* Left: Status Icon, Title & Badge */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusIcon className={`w-4 h-4 shrink-0 ${statusConfig.color}`} />

                  <span className="text-sm font-medium text-foreground truncate max-w-50 sm:max-w-xs">
                    {deliv.title}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${statusConfig.bg} shrink-0`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Right: Due Date & Actions */}
                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 ml-7 sm:ml-0">
                  {/* Due Date */}
                  <div className={`text-xs whitespace-nowrap ${isOverdue ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
                    {deliv.dueDate
                      ? format(new Date(deliv.dueDate), "dd MMM")
                      : "-"}
                  </div>

                  {/* Actions & Comment Trigger */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <DeliverableActions deliverableId={deliv.id} status={deliv.status} role={memberRole} />

                    <AccordionItem value={deliv.id} className="border-none">
                      <AccordionTrigger className="p-0 hover:no-underline active:scale-[0.96] transition-transform">
                        <div className="flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium rounded-full border border-border/60 bg-background text-foreground hover:bg-muted/60 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="tabular-nums font-semibold">{delivComments.length}</span>
                        </div>
                      </AccordionTrigger>
                    </AccordionItem>
                  </div>
                </div>
              </div>

              {/* Submission Information Pill if submitted */}
              {deliv.submissionTitle && (
                <div className="mx-3 my-2 bg-muted/40 rounded-lg p-2.5 border border-border/30 space-y-1 text-xs">
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
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-0.5"
                    >
                      View Attachment Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Accordion Content for Comment Thread */}
              <AccordionItem value={deliv.id} className="border-none">
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="h-[360px] flex flex-col bg-background/60 rounded-xl border border-border/30 p-3">
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
            </motion.div>
          );
        })}
      </Accordion>
    </div>
  );
}
