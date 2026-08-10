"use client"

import { PieChart, CheckSquare } from "lucide-react"

export interface ProposalBreakdownItem {
  name: string
  value: number
  color: string
}

export interface DeliverableHealthItem {
  label: string
  count: number
  percentage: number
  color: string
}

interface AnalyticsBreakdownsUIProps {
  proposalBreakdown: ProposalBreakdownItem[]
  deliverableHealth: DeliverableHealthItem[]
}

export function AnalyticsBreakdownsUI({
  proposalBreakdown,
  deliverableHealth,
}: AnalyticsBreakdownsUIProps) {
  const totalProposals = proposalBreakdown.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Proposal Status Distribution */}
      <div className="flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-4 rounded-md bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              <PieChart className="h-4 w-4 text-brand" /> Proposal Status Breakdown
            </span>
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {totalProposals} Total Proposals
            </span>
          </div>

          <div className="space-y-3">
            {proposalBreakdown.map((item) => {
              const pct = totalProposals > 0 ? Math.round((item.value / totalProposals) * 100) : 0
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {item.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Deliverable Execution Health */}
      <div className="flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-4 rounded-md bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              <CheckSquare className="h-4 w-4 text-emerald-500" /> Deliverable Execution Health
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Review Status
            </span>
          </div>

          <div className="space-y-3">
            {deliverableHealth.map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
