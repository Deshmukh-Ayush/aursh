"use client"

import {
  EChartsRadialChart,
  type ChartConfig,
} from "@/components/evilcharts/charts/echarts-radial-chart"
import {
  CurrencyInrIcon,
  TrendUpIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react"
import type {
  OverviewProject,
  OverviewProposal,
  OverviewContract,
} from "./project-overview-types"
import { ProjectOverviewAvatarStack } from "./project-overview-avatar-stack"
import { MarkCompleteButton } from "@/components/projects/mark-complete-button"
import { format } from "date-fns"

type ProjectOverviewHeroProps = {
  project: OverviewProject
  projectId: string
  completionPct: number
  daysActive: number
  canComplete: boolean
  nextDeadline: { title: string; date: string } | null
  proposal: OverviewProposal | null
  contract: OverviewContract | null
  userRole: string
}

function formatCurrency(amount: number, currency: string = "INR") {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
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
  let valueText = "--"
  let valueSub = "No proposal attached"
  let isAccepted = false

  if (proposal) {
    valueText = formatCurrency(proposal.price, proposal.currency)
    valueSub =
      proposal.status === "accepted"
        ? "Accepted Statement of Work"
        : "Pending Client Approval"
    isAccepted = proposal.status === "accepted"
  } else if (contract) {
    valueText =
      contract.status === "signed" ? "Fully Executed" : "Pending Signature"
    valueSub = contract.fileName
    isAccepted = contract.status === "signed"
  }

  // Next deadline logic
  const deadlineText = nextDeadline
    ? format(new Date(nextDeadline.date), "dd MMM")
    : "No upcoming deadlines"
  const deadlineSub = nextDeadline
    ? nextDeadline.title
    : "All deliverables on schedule"

  // Micro Radial Config for KPI Card 2
  const radialData = [
    {
      name: "completion",
      value: completionPct,
    },
  ]

  const radialConfig = {
    completion: {
      label: "Approved",
      colors: {
        light: ["var(--color-primary)"],
        dark: ["var(--color-primary)"],
      },
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      {/* Top Header Row: Title, Description & Avatars */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance text-foreground">
            {project.name}
          </h1>
          {project.description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-pretty text-muted-foreground">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* KPI Card 1: Financial & Contract Volume */}
        <div className="bg-neutral-gray-50 rounded-md p-1 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_0px_rgba(0,0,0,0.04)] dark:bg-neutral-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex h-full flex-col justify-between space-y-4 rounded-sm bg-white p-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_0px_rgba(0,0,0,0.04)] dark:bg-neutral-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <CurrencyInrIcon className="h-4 w-4 text-emerald-500" /> Total
                Project Value
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold tracking-wider uppercase ${isAccepted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}
              >
                {isAccepted ? "Accepted SOW" : "Draft / Pending"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[32px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
                {valueText}
              </div>
              <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
                {valueSub}
              </p>
            </div>

            {/* Integrated Volume Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>Contract Compliance</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {isAccepted ? "100%" : "50%"}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={isAccepted ? 100 : 50}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Contract compliance"
              >
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: isAccepted ? "100%" : "50%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Delivery Progress & Velocity */}
        <div className="rounded-md bg-gray-50 p-1 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_0px_rgba(0,0,0,0.04)] dark:bg-neutral-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex h-full flex-col justify-between space-y-4 rounded-sm bg-white p-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_0px_rgba(0,0,0,0.04)] dark:bg-neutral-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <TrendUpIcon className="h-4 w-4 text-emerald-500" /> Milestone
                Progress
              </span>
              <span className="flex items-center justify-center rounded-full border border-sky-500/30 p-[1px]">
                <span className="rounded-full bg-sky-500/10 pt-[5px] pr-2 pb-[3px] pl-2.5 text-xs leading-none font-semibold tracking-wider text-sky-600 uppercase tabular-nums dark:text-sky-400">
                  {completionPct}% Done
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-3xl leading-none font-semibold tracking-tight text-foreground tabular-nums">
                  {completionPct}%
                </div>
                <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
                  Next:{" "}
                  <span className="font-medium text-foreground">
                    {deadlineSub}
                  </span>{" "}
                  ({deadlineText})
                </p>
              </div>

              {/* Integrated Micro EvilCharts Radial Gauge */}
              <div className="aspect-square h-14 w-14 shrink-0">
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
          </div>
        </div>
      </div>
    </div>
  )
}
