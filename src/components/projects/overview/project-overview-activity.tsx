import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity } from "lucide-react";
import type { OverviewActivity } from "./project-overview-types";

type ProjectOverviewActivityProps = {
  projectId: string;
  recentActivity: OverviewActivity[];
};

const ACTIVITY_LABELS: Record<string, string> = {
  contract_uploaded: "uploaded a contract",
  contract_signed: "signed the contract",
  file_uploaded: "uploaded a file",
  deliverable_created: "created a deliverable",
  deliverable_approved: "approved a deliverable",
  revision_requested: "requested a revision",
  deliverable_completed: "completed a deliverable",
  project_completed: "marked the project complete",
  member_joined: "joined the project",
  deliverable_in_review: "submitted for review",
  comment_added: "added a comment",
  proposal_sent: "sent a proposal",
  proposal_accepted: "accepted the proposal",
  proposal_declined: "declined the proposal",
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getMetadataDetail(type: string, metadata: Record<string, any> | null): string | null {
  if (!metadata) return null;

  switch (type) {
    case "deliverable_created":
    case "deliverable_approved":
    case "deliverable_in_review":
    case "revision_requested":
      return metadata.title ? `"${metadata.title}"` : null;
    case "file_uploaded":
    case "contract_uploaded":
      return metadata.fileName ?? null;
    case "proposal_sent":
    case "proposal_accepted":
    case "proposal_declined":
      return metadata.title ? `"${metadata.title}"` : null;
    case "comment_added":
      return metadata.deliverableTitle ? `on "${metadata.deliverableTitle}"` : null;
    default:
      return null;
  }
}

export function ProjectOverviewActivity({ projectId, recentActivity }: ProjectOverviewActivityProps) {
  return (
    <div className="lg:col-span-3 flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950 flex flex-col h-full justify-between gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
            Recent Activity Trail
          </h2>
          <a
            href={`/projects/${projectId}/activity`}
            className="group flex items-center gap-1 text-xs font-semibold text-[#00AAF7] hover:underline"
          >
            View all <span>→</span>
          </a>
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <Activity className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-[13px] text-muted-foreground">No activity recorded yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.slice(0, 5).map(({ log, actor }) => {
              const detail = getMetadataDetail(log.type, log.metadata);
              return (
                <div key={log.id} className="group flex items-center justify-between gap-3 py-2 px-2.5 hover:bg-muted/40 border-b border-border/30 last:border-0 transition-colors rounded-md">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar className="h-5.5 w-5.5 shrink-0 border border-background">
                      <AvatarImage src={actor?.image || ""} className="rounded-full" />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-semibold">
                        {actor?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 truncate text-xs">
                      <span className="font-semibold text-foreground">{actor?.name || "Someone"}</span>{" "}
                      <span className="text-muted-foreground">{ACTIVITY_LABELS[log.type] || log.type}</span>
                      {detail ? (
                        <span className="text-muted-foreground/80 font-medium truncate"> {detail}</span>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {relativeTime(new Date(log.createdAt))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
