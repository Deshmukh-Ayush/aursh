import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamKpiRow } from "@/components/dashboard/team/team-kpi-row"
import { TeamAnalyticsBreakdown } from "@/components/dashboard/team/team-analytics-breakdown"
import { TeamWorkflowsTable } from "@/components/dashboard/team/team-workflows-table"

export default function DashboardTeamPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management & Workflows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time visibility into team members, seat usage, role distribution, top contributors, and workflow activity.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Level 1: Seat Usage & Team Pace Scoreboard */}
        <Suspense fallback={<Skeleton className="h-[140px] w-full rounded-md" />}>
          <TeamKpiRow />
        </Suspense>

        {/* Level 2: Top Contributors & Team Activity Stream */}
        <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-md" />}>
          <TeamAnalyticsBreakdown />
        </Suspense>

        {/* Level 3: Top Workflows by Activity Table */}
        <Suspense fallback={<Skeleton className="h-[360px] w-full rounded-md" />}>
          <TeamWorkflowsTable />
        </Suspense>
      </div>
    </div>
  )
}
