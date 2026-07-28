import Link from "next/link";
import { AlertCircle, Eye, RotateCcw } from "lucide-react";
import type { OverviewDeliverable } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewAttentionProps = {
  projectId: string;
  items: OverviewDeliverable[];
};

const STATUS_ICON: Record<string, { icon: typeof Eye; color: string; label: string }> = {
  in_review: { icon: Eye, color: "text-blue-500", label: "In Review" },
  revision_requested: { icon: RotateCcw, color: "text-red-500", label: "Revision" },
};

export function ProjectOverviewAttention({ projectId, items }: ProjectOverviewAttentionProps) {
  // Don't render at all if nothing needs attention
  if (items.length === 0) return null;

  return (
    <ProjectOverviewCard className="lg:col-span-3" padding="md">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <h2 className="text-[13px] font-semibold text-foreground">
          Needs Attention
          <span className="ml-1.5 tabular-nums text-muted-foreground font-normal">({items.length})</span>
        </h2>
      </div>

      <div className="space-y-0">
        {items.map((item) => {
          const config = STATUS_ICON[item.status] ?? STATUS_ICON.in_review;
          const Icon = config.icon;
          const dueDateStr = item.dueDate
            ? new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : null;
          const isOverdue = item.dueDate ? new Date(item.dueDate) < new Date() : false;

          return (
            <Link
              key={item.id}
              href={`/projects/${projectId}/deliverables`}
              className="group flex items-center gap-3 rounded-lg px-2 py-2.5 -mx-2 transition-all hover:bg-muted/50 active:scale-[0.96]"
            >
              <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{config.label}</span>
                  {dueDateStr ? (
                    <>
                      <span>·</span>
                      <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                        {isOverdue ? "Overdue" : dueDateStr}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </ProjectOverviewCard>
  );
}
