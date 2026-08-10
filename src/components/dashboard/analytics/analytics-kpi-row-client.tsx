"use client"

import { DollarSign, Send, CheckCircle2, Award } from "lucide-react"

export interface AnalyticsKpiData {
  wonRevenue: number
  pipelineValue: number
  winRate: number
  acceptedProposalsCount: number
  totalClosedProposalsCount: number
  deliverableApprovalRate: number
  approvedDeliverablesCount: number
  totalDeliverablesCount: number
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

export function AnalyticsKpiRowClient({ data }: { data: AnalyticsKpiData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Won Revenue */}
      <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-3 rounded-md bg-white p-4 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Won Revenue
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400 tabular-nums">
              Signed
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(data.wonRevenue)}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              From {data.acceptedProposalsCount} accepted proposals
            </p>
          </div>
        </div>
      </div>

      {/* KPI 2: Active Pipeline */}
      <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-3 rounded-md bg-white p-4 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <Send className="h-3.5 w-3.5 text-brand" /> Active Pipeline
            </span>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-brand uppercase tabular-nums">
              Pending
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(data.pipelineValue)}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Proposals sent awaiting sign-off
            </p>
          </div>
        </div>
      </div>

      {/* KPI 3: Proposal Win Rate */}
      <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-3 rounded-md bg-white p-4 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <Award className="h-3.5 w-3.5 text-amber-500" /> Proposal Win Rate
            </span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400 tabular-nums">
              {data.winRate}%
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {data.winRate}%
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {data.acceptedProposalsCount} of {data.totalClosedProposalsCount} closed deals won
            </p>
          </div>
        </div>
      </div>

      {/* KPI 4: Deliverable Approval Rate */}
      <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-3 rounded-md bg-white p-4 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" /> Approval Velocity
            </span>
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-sky-600 uppercase dark:text-sky-400 tabular-nums">
              {data.deliverableApprovalRate}%
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {data.deliverableApprovalRate}%
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {data.approvedDeliverablesCount} of {data.totalDeliverablesCount} deliverables approved
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
