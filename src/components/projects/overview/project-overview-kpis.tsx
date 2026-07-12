import { FileText, Files, CheckCircle2, Eye, RotateCcw, Clock } from "lucide-react";
import type { ProjectOverviewData } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewKpisProps = {
  project: ProjectOverviewData;
  completionPct: number;
  approvedDelivs: number;
  totalDelivs: number;
  contractStatus: string;
};

export function ProjectOverviewKpis({
  project,
  completionPct,
  approvedDelivs,
  totalDelivs,
  contractStatus,
}: ProjectOverviewKpisProps) {
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (completionPct / 100) * ringCircumference;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <ProjectOverviewCard padding="sm" className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="56" height="56" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/50" />
            <circle
              cx="48"
              cy="48"
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-emerald-500 transition-[stroke-dashoffset] duration-700"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums">
            {completionPct}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Completion</p>
          <p className="text-sm font-semibold tabular-nums">
            {approvedDelivs}
            <span className="font-normal text-muted-foreground">/{totalDelivs}</span>
          </p>
        </div>
      </ProjectOverviewCard>

      <ProjectOverviewCard padding="sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
            <Files className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Files</span>
        </div>
        <p className="text-xl font-bold tabular-nums">{project.files.length}</p>
      </ProjectOverviewCard>

      <ProjectOverviewCard padding="sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10">
            <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contract</span>
        </div>
        <p className="text-sm font-semibold capitalize">
          {contractStatus === "none" ? "Not uploaded" : contractStatus.replace("_", " ")}
        </p>
      </ProjectOverviewCard>

      <ProjectOverviewCard padding="sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10">
            <svg className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Team</span>
        </div>
        <p className="text-xl font-bold tabular-nums">{project.members.length}</p>
      </ProjectOverviewCard>
    </div>
  );
}
