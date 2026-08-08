"use client";

import { Paperclip, ExternalLink } from "lucide-react";

type DeliverableSubmissionBadgeProps = {
  submissionTitle: string;
  submissionNote?: string | null;
  submissionUrl?: string | null;
};

export function DeliverableSubmissionBadge({
  submissionTitle,
  submissionNote,
  submissionUrl,
}: DeliverableSubmissionBadgeProps) {
  return (
    <div className="mx-3 my-2 bg-muted/40 rounded-lg p-2.5 border border-border/30 space-y-1 text-xs">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Paperclip className="w-3.5 h-3.5 text-primary" /> Submitted Work: {submissionTitle}
      </div>
      {submissionNote && (
        <p className="text-foreground/90 leading-relaxed text-xs text-pretty">{submissionNote}</p>
      )}
      {submissionUrl && (
        <a
          href={submissionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-0.5"
        >
          View Attachment Link <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
