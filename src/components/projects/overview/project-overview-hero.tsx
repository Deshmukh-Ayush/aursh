"use client";

import { EChartsRadialChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-radial-chart";
import { CurrencyInrIcon, TrendUpIcon, CalendarBlankIcon, SealCheckIcon, FolderSimpleIcon } from "@phosphor-icons/react";
import type { OverviewProject, OverviewProposal, OverviewContract } from "./project-overview-types";
import { ProjectOverviewAvatarStack } from "./project-overview-avatar-stack";
import { MarkCompleteButton } from "@/components/projects/mark-complete-button";
import { format } from "date-fns";

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

function formatCurrency(amount: number, currency: string = "INR") {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function ProjectOverviewHero({
  project,
  projectId,
  completionPct,
  canComplete,
  nextDeadline,
  proposal,
  contract,
}: ProjectOverviewHeroProps) {
  // Value KPI logic
  let valueText = "--";
  let valueSub = "No proposal attached";
  let isAccepted = false;

  if (proposal) {
    valueText = formatCurrency(proposal.price, proposal.currency);
    valueSub = proposal.status === "accepted" ? "Accepted Statement of Work" : "Pending Client Approval";
    isAccepted = proposal.status === "accepted";
  } else if (contract) {
    valueText = contract.status === "signed" ? "Fully Executed" : "Pending Signature";
    valueSub = contract.fileName;
    isAccepted = contract.status === "signed";
  }

  // Next deadline logic
  const deadlineText = nextDeadline
    ? format(new Date(nextDeadline.date), "dd MMM")
    : "No upcoming deadlines";
  const deadlineSub = nextDeadline ? nextDeadline.title : "All deliverables on schedule";

  // Micro Radial Config for KPI Card 2
  const radialData = [
    {
      name: "completion",
      value: completionPct,
    },
  ];

  const radialConfig = {
    completion: {
      label: "Approved",
      colors: { light: ["#00AAF7"], dark: ["#00AAF7"] },
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Top Header Row: Title, Description & Avatars */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2 border-b border-border/20">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight">
            {project.name}
          </h1>
          {project.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-3xl">
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
          <ProjectOverviewAvatarStack members={project.members} />
          {canComplete ? <MarkCompleteButton projectId={projectId} /> : null}
        </div>
      </div>

      {/* 2 Hero KPI Cards with Integrated Micro Charts & Visual Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPI Card 1: Financial & Contract Volume */}
        <div className="rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
          <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CurrencyInrIcon className="w-4 h-4 text-[#00AAF7]" /> Total Project Value
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isAccepted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                {isAccepted ? "Accepted SOW" : "Draft / Pending"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[32px] font-semibold tracking-tight tabular-nums text-foreground leading-none">
                {valueText}
              </div>
              <p className="text-xs text-muted-foreground text-pretty leading-relaxed">
                {valueSub}
              </p>
            </div>

            {/* Integrated Volume Progress Bar */}
            <div className="pt-2 space-y-1.5 border-t border-border/20">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>Contract Compliance</span>
                <span className="tabular-nums font-semibold text-foreground">{isAccepted ? "100%" : "50%"}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00AAF7] rounded-full transition-all duration-500"
                  style={{ width: isAccepted ? "100%" : "50%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Delivery Progress & Velocity */}
        <div className="rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
          <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <TrendUpIcon className="w-4 h-4 text-emerald-500" /> Delivery Velocity & Milestone Progress
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 tabular-nums">
                {completionPct}% Done
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-[32px] font-semibold tracking-tight tabular-nums text-foreground leading-none">
                  {completionPct}%
                </div>
                <p className="text-xs text-muted-foreground text-pretty leading-relaxed truncate">
                  Next: <span className="font-medium text-foreground">{deadlineSub}</span> ({deadlineText})
                </p>
              </div>

              {/* Integrated Micro EvilCharts Radial Gauge */}
              <div className="aspect-square w-14 h-14 shrink-0">
                <EChartsRadialChart
                  data={radialData}
                  config={radialConfig}
                  nameKey="name"
                  max={100}
                  innerRadius="70%"
                  outerRadius="100%"
                  className="h-full w-full"
                >
                  <EChartsRadialChart.RadialBar
                    dataKey="value"
                    barSize={7}
                    cornerRadius={6}
                  />
                </EChartsRadialChart>
              </div>
            </div>

            {/* Integrated Milestone Deadline Sub-bar */}
            <div className="pt-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground border-t border-border/20">
              <span className="flex items-center gap-1">
                <CalendarBlankIcon className="w-3.5 h-3.5 text-muted-foreground" /> Next Deadline
              </span>
              <span className="tabular-nums font-semibold text-foreground">{deadlineText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
