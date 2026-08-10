import { db } from "@/utils/db"
import { activityLog, project } from "@/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { headers } from "next/headers"
import { format, subDays, isSameDay } from "date-fns"
import { DashboardHeroChartUI } from "./hero-chart-client"

export async function DashboardHeroChart() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  // Fetch activity over the last 7 days
  const today = new Date()
  const sevenDaysAgo = subDays(today, 6)
  
  const recentActivity = await db
    .select({ createdAt: activityLog.createdAt })
    .from(activityLog)
    .innerJoin(project, eq(activityLog.projectId, project.id))
    .where(
      and(
        eq(project.organizationId, ctx.organizationId),
        gte(activityLog.createdAt, sevenDaysAgo)
      )
    )

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
    <DashboardHeroChartUI
      chartData={chartData}
      totalEvents={totalEvents}
      topDayLabel={maxDayLabel}
      topDayCount={maxActions}
      avgDaily={avgDaily}
    />
  )
}
