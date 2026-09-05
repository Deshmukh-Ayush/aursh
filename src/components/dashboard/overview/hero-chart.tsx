import { getTenantContext } from "@/lib/tenant-context"
import { getAccessibleProjectIds } from "@/lib/project-queries"
import { getCachedRecentActivity } from "@/utils/cached-org-queries"
import { headers } from "next/headers"
import { format, subDays, isSameDay } from "date-fns"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const DynamicDashboardHeroChartUI = dynamic(
  () => import("./hero-chart-client").then((mod) => mod.DashboardHeroChartUI),
  {
    loading: () => <Skeleton className="h-[340px] w-full rounded-2xl" />,
  }
)

export async function DashboardHeroChart() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.user) {
    return null
  }

  const projectIds = await getAccessibleProjectIds(ctx.user.id, ctx.organizationId)
  if (projectIds.length === 0) {
    return (
      <DynamicDashboardHeroChartUI
        chartData={[]}
        totalEvents={0}
        avgDaily={0}
        topDayLabel=""
        topDayCount={0}
      />
    )
  }

  // Fetch activity over the last 7 days (deduplicated with KPI row via React.cache)
  const today = new Date()
  const sevenDaysAgo = subDays(today, 6)
  const projectIdsKey = [...projectIds].sort().join(",")
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()

  const recentActivity = await getCachedRecentActivity(projectIdsKey, sevenDaysAgoIso)

  // Aggregate into daily buckets for 7 days
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))

  let maxActions = 0
  let maxDayLabel = format(today, "MMM d")

  const chartData = days.map((d) => {
    const dayLabel = format(d, "MMM d")
    const count = recentActivity.filter((a) => isSameDay(new Date(a.createdAt), d)).length
    if (count > maxActions) {
      maxActions = count
      maxDayLabel = dayLabel
    }
    return {
      day: dayLabel,
      activity: count,
    }
  })

  const totalEvents = recentActivity.length
  const avgDaily = parseFloat((totalEvents / 7).toFixed(1))

  return (
    <DynamicDashboardHeroChartUI
      chartData={chartData}
      totalEvents={totalEvents}
      topDayLabel={maxDayLabel}
      topDayCount={maxActions}
      avgDaily={avgDaily}
    />
  )
}
