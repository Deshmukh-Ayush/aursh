import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalyticsKpiRow } from "@/components/dashboard/analytics/analytics-kpi-row"
import { AnalyticsHeroChart } from "@/components/dashboard/analytics/analytics-hero-chart"
import { AnalyticsBreakdowns } from "@/components/dashboard/analytics/analytics-breakdowns"
import { AnalyticsProjectTable } from "@/components/dashboard/analytics/analytics-project-table"

export default function DashboardAnalyticsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics & Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time metrics on revenue velocity, proposal conversion, deliverable execution, and pipeline health.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Level 1: KPI Scoreboard */}
        <Suspense fallback={<Skeleton className="h-[140px] w-full rounded-md" />}>
          <AnalyticsKpiRow />
        </Suspense>

        {/* Level 2: Hero 6-Month Velocity Chart */}
        <Suspense fallback={<Skeleton className="h-[340px] w-full rounded-md" />}>
          <AnalyticsHeroChart />
        </Suspense>

        {/* Level 3: Proposal Conversion & Execution Breakdowns */}
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-md" />}>
          <AnalyticsBreakdowns />
        </Suspense>

        {/* Level 4: Project Performance Table */}
        <Suspense fallback={<Skeleton className="h-[360px] w-full rounded-md" />}>
          <AnalyticsProjectTable />
        </Suspense>
      </div>
    </div>
  )
}
