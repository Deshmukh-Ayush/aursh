import { CalendarDays, Clock, TrendingUp, DollarSign } from "lucide-react";
import type { OverviewProject, OverviewProposal, OverviewContract } from "./project-overview-types";
import { ProjectOverviewAvatarStack } from "./project-overview-avatar-stack";
import { MarkCompleteButton } from "@/components/projects/mark-complete-button";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewHeroProps = {
  project: OverviewProject;
  projectId: string;
  completionPct: number;
  daysActive: number;
  canComplete: boolean;
  nextDeadline: { title: string; date: string } | null;
  proposal: OverviewProposal | null;
  contract: OverviewContract | null;
  userRole: string;
};

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProjectOverviewHero({
  project,
  projectId,
  completionPct,
  daysActive,
  canComplete,
  nextDeadline,
  proposal,
  contract,
  userRole,
}: ProjectOverviewHeroProps) {
  // Value KPI logic
  let valueLabel = "Project Value";
  let valueText = "--";
  let valueSub = "No active proposal";

  if (proposal) {
    valueText = formatCurrency(proposal.price, proposal.currency);
    valueSub = proposal.status === "accepted" ? "Accepted" : "Pending";
  } else if (contract) {
    valueLabel = "Contract Status";
    valueText = contract.status === "signed" ? "Signed" : "Pending";
    valueSub = "No proposal attached";
  }

  // Next deadline logic
  const deadlineDate = nextDeadline
    ? new Date(nextDeadline.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "--";
  const deadlineSub = nextDeadline ? nextDeadline.title : "No upcoming deadlines";

  const kpis = [
    {
      title: valueLabel,
      value: valueText,
      subtext: valueSub,
      icon: DollarSign,
    },
    {
      title: "Completion",
      value: `${completionPct}%`,
      subtext: "Deliverables approved",
      icon: TrendingUp,
    },
    {
      title: "Next Deadline",
      value: deadlineDate,
      subtext: deadlineSub,
      icon: CalendarDays,
    },
    {
      title: "Time Active",
      value: `${daysActive}d`,
      subtext: "Since project creation",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top row: name + avatars */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h1
            className="text-2xl font-semibold tracking-tight text-foreground"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {project.name}
          </h1>
          {project.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2" style={{ textWrap: "pretty" } as React.CSSProperties}>
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ProjectOverviewAvatarStack members={project.members} />
          {canComplete ? <MarkCompleteButton projectId={projectId} /> : null}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <ProjectOverviewCard key={idx} padding="md" className="flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted-foreground">{kpi.title}</span>
                <Icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                  {kpi.value}
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground truncate">
                  {kpi.subtext}
                </div>
              </div>
            </ProjectOverviewCard>
          );
        })}
      </div>
    </div>
  );
}
