"use client";

import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { DeliverableItem as DeliverableType } from "./types";
import { motion } from "framer-motion";
import { DeliverableItem } from "./deliverable-item";
import { DeliverableSubmissionBadge } from "./deliverable-submission-badge";

interface DeliverableListProps {
  deliverables: DeliverableType[];
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
  return (
    <div className="w-full">
      <Accordion type="multiple" className="w-full">
        {deliverables.map((deliv, index) => {
          const delivComments = allComments.filter((c) => c.comment.deliverableId === deliv.id);

          return (
            <motion.div
              key={deliv.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: index * 0.02 }}
              className="border-b border-border/40 last:border-0 rounded-md"
            >
              {/* Deliverable Row Item */}
              <DeliverableItem
                item={deliv}
                index={index}
                commentCount={delivComments.length}
                memberRole={memberRole}
              />

              {/* Submission Information Pill if submitted */}
              {deliv.submissionTitle && (
                <DeliverableSubmissionBadge
                  submissionTitle={deliv.submissionTitle}
                  submissionNote={deliv.submissionNote}
                  submissionUrl={deliv.submissionUrl}
                />
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
