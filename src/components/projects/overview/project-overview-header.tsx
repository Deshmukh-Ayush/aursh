import { Badge } from "@/components/ui/badge";
import { MarkCompleteButton } from "@/components/projects/mark-complete-button";
import { ProjectOverviewAvatarStack } from "./project-overview-avatar-stack";
import type { ProjectOverviewData } from "./project-overview-types";

type ProjectOverviewHeaderProps = {
  project: ProjectOverviewData;
  projectId: string;
  canComplete: boolean;
  daysActive: number;
};

export function ProjectOverviewHeader({
  project,
  projectId,
  canComplete,
  daysActive,
}: ProjectOverviewHeaderProps) {
  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" style={{ textWrap: "balance" }}>
              {project.name}
            </h1>
            <Badge
              variant="secondary"
              className={`capitalize text-[11px] font-semibold shadow-none ${
                project.status === "active"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : project.status === "completed"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Created {new Date(project.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            {" · "}
            <span className="tabular-nums">{daysActive}</span> days active
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ProjectOverviewAvatarStack members={project.members} />
          {canComplete && <MarkCompleteButton projectId={projectId} />}
        </div>
      </div>
    </>
  );
}
