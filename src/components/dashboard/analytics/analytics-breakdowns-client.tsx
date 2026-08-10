"use client"

import { PieChart, CheckSquare } from "lucide-react"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"

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
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              <PieChart className="h-4 w-4 text-brand" /> Proposal Status Breakdown
            </span>
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {totalProposals} Total Proposals
            </span>
          </div>
        }
        innerClassName="p-5 space-y-4"
      >
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
      </ConcentricCard>

      {/* Deliverable Execution Health */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              <CheckSquare className="h-4 w-4 text-emerald-500" /> Deliverable Execution Health
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Review Status
            </span>
          </div>
        }
        innerClassName="p-5 space-y-4"
      >
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
      </ConcentricCard>
    </div>
  )
}
