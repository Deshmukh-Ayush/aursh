import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity } from "lucide-react";
import type { ProjectActivityItem } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewActivityProps = {
  projectId: string;
  recentActivity: Array<{
    log: ProjectActivityItem;
    actor: { id: string; name: string | null; image: string | null } | null;
  }>;
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

export function ProjectOverviewActivity({ projectId, recentActivity }: ProjectOverviewActivityProps) {
  return (
    <ProjectOverviewCard className="lg:col-span-3" padding="md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Recent Activity</h2>
        <a
          href={`/projects/${projectId}/activity`}
          className="group flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>

      {recentActivity.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
              <Activity className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-[13px] text-muted-foreground">No activity yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {recentActivity.map(({ log, actor }) => (
            <div key={log.id} className="flex items-start gap-3 border-b border-border/10 py-2.5 last:border-0">
              <Avatar className="mt-0.5 h-6 w-6 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <AvatarImage src={actor?.image || ""} className="rounded-full outline outline-black/8 dark:outline-white/8" />
                <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-semibold">
                  {actor?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug">
                  <span className="font-medium">{actor?.name || "Someone"}</span>{" "}
                  <span className="text-muted-foreground">{ACTIVITY_LABELS[log.type] || log.type}</span>
                </p>
              </div>
              <span className="mt-0.5 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {relativeTime(new Date(log.createdAt))}
              </span>
            </div>
          ))}
        </div>
      )}
    </ProjectOverviewCard>
  );
}
