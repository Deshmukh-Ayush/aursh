import { headers } from "next/headers"
import { db } from "@/utils/db"
import { project, proposal } from "@/db/schema"
import { eq, inArray, gte, and } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns"
import { AnalyticsHeroChartUI, MonthlyVelocityPoint } from "./analytics-hero-chart-client"

export async function AnalyticsHeroChart() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  const today = new Date()
  const sixMonthsAgo = startOfMonth(subMonths(today, 5))

  // Fetch projects
  const orgProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.organizationId, ctx.organizationId))

  const projectIds = orgProjects.map((p) => p.id)

  if (projectIds.length === 0) {
    const emptyChart = Array.from({ length: 6 }, (_, i) => ({
      month: format(subMonths(today, 5 - i), "MMM yyyy"),
      revenue: 0,
      pipeline: 0,
    }))
    return (
      <AnalyticsHeroChartUI
        chartData={emptyChart}
        totalWon={0}
        peakMonthLabel="--"
        peakMonthValue={0}
        monthlyAvg={0}
      />
    )
  }

  // Fetch proposals over last 6 months
  const proposalsList = await db
    .select({
      price: proposal.price,
      status: proposal.status,
      createdAt: proposal.createdAt,
    })
    .from(proposal)
    .where(and(inArray(proposal.projectId, projectIds), gte(proposal.createdAt, sixMonthsAgo)))

  // Generate 6 monthly buckets
  const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))

  let totalWon = 0
  let maxRevenue = 0
  let peakMonthLabel = format(today, "MMM yyyy")

  const chartData: MonthlyVelocityPoint[] = months.map((m) => {
    const monthLabel = format(m, "MMM yyyy")
    let revenue = 0
    let pipeline = 0

    proposalsList.forEach((p) => {
      if (isSameMonth(new Date(p.createdAt), m)) {
        if (p.status === "accepted") {
          revenue += p.price
        } else if (p.status === "sent") {
          pipeline += p.price
        }
      }
    })

    totalWon += revenue
    if (revenue > maxRevenue) {
      maxRevenue = revenue
      peakMonthLabel = monthLabel
    }

    return {
      month: monthLabel,
      revenue,
      pipeline,
    }
  })

  const monthlyAvg = Math.round(totalWon / 6)

  return (
    <AnalyticsHeroChartUI
      chartData={chartData}
      totalWon={totalWon}
      peakMonthLabel={peakMonthLabel}
      peakMonthValue={maxRevenue}
      monthlyAvg={monthlyAvg}
    />
  )
}
