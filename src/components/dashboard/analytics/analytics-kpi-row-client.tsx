"use client"

import { DollarSign, Send, CheckCircle2, Award } from "lucide-react"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"

export interface AnalyticsKpiData {
  wonRevenue: number
  pipelineValue: number
  currency?: "USD" | "INR"
  winRate: number
  acceptedProposalsCount: number
  totalClosedProposalsCount: number
  deliverableApprovalRate: number
  approvedDeliverablesCount: number
  totalDeliverablesCount: number
}

function formatCurrency(amount: number, currency: string = "USD") {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`
  return `$${amount.toLocaleString("en-US")}`
}

export function AnalyticsKpiRowClient({ data }: { data: AnalyticsKpiData }) {
  const curr = data.currency || "USD"

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Won Revenue */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Won Revenue
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400 tabular-nums">
              Signed
            </span>
          </div>
        }
        innerClassName="p-4 space-y-3"
      >
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(data.wonRevenue, curr)}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            From {data.acceptedProposalsCount} accepted proposals
          </p>
        </div>
      </ConcentricCard>

      {/* KPI 2: Active Pipeline */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <Send className="h-3.5 w-3.5 text-brand" /> Active Pipeline
            </span>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-brand uppercase tabular-nums">
              Pending
            </span>
          </div>
        }
        innerClassName="p-4 space-y-3"
      >
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(data.pipelineValue, curr)}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Proposals sent awaiting sign-off
          </p>
        </div>
      </ConcentricCard>

      {/* KPI 3: Proposal Win Rate */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <Award className="h-3.5 w-3.5 text-amber-500" /> Proposal Win Rate
            </span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400 tabular-nums">
              {data.winRate}%
            </span>
          </div>
        }
        innerClassName="p-4 space-y-3"
      >
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {data.winRate}%
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {data.acceptedProposalsCount} of {data.totalClosedProposalsCount} closed deals won
          </p>
        </div>
      </ConcentricCard>

      {/* KPI 4: Deliverable Approval Rate */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" /> Approval Velocity
            </span>
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-sky-600 uppercase dark:text-sky-400 tabular-nums">
              {data.deliverableApprovalRate}%
            </span>
          </div>
        }
        innerClassName="p-4 space-y-3"
      >
        <div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {data.deliverableApprovalRate}%
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {data.approvedDeliverablesCount} of {data.totalDeliverablesCount} deliverables approved
          </p>
        </div>
      </ConcentricCard>
    </div>
  )
}
