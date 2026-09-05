import { headers } from "next/headers"
import { db } from "@/utils/db"
import { proposal, organization } from "@/db/schema"
import { inArray, gte, and, eq } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { getCachedOrgProjects } from "@/utils/cached-org-queries"
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthlyVelocityPoint } from "./analytics-hero-chart-client"
import { convertAndAggregate, getUsdToInrRate } from "@/lib/currency"

const DynamicAnalyticsHeroChartUI = dynamic(
  () => import("./analytics-hero-chart-client").then((mod) => mod.AnalyticsHeroChartUI),
  {
    loading: () => <Skeleton className="h-[380px] w-full rounded-2xl" />,
  }
)

export async function AnalyticsHeroChart() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  const today = new Date()
  const sixMonthsAgo = startOfMonth(subMonths(today, 5))

  const orgProjects = await getCachedOrgProjects(ctx.organizationId)

  const [org] = await db
    .select({ globalCurrency: organization.globalCurrency })
    .from(organization)
    .where(eq(organization.id, ctx.organizationId))
  const targetCurrency: "USD" | "INR" = (org?.globalCurrency as "USD" | "INR") || "USD"

  const projectIds = orgProjects.map((p) => p.id)

  if (projectIds.length === 0) {
    const emptyChart: MonthlyVelocityPoint[] = Array.from({ length: 6 }, (_, i) => ({
      month: format(subMonths(today, 5 - i), "MMM yyyy"),
      revenue: 0,
      pipeline: 0,
    }))
    return (
      <DynamicAnalyticsHeroChartUI
        velocityData={emptyChart}
        peakMonthLabel="--"
        peakMonthRevenue={0}
        monthlyAvgRevenue={0}
        totalWon={0}
        currency={targetCurrency}
      />
    )
  }

  const [proposalsList, usdToInrRate] = await Promise.all([
    db
      .select({
        price: proposal.price,
        currency: proposal.currency,
        status: proposal.status,
        createdAt: proposal.createdAt,
      })
      .from(proposal)
      .where(and(inArray(proposal.projectId, projectIds), gte(proposal.createdAt, sixMonthsAgo))),
    getUsdToInrRate(),
  ])

  const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))

  let totalWon = 0
  let maxRevenue = 0
  let peakMonthLabel = format(today, "MMM yyyy")

  const velocityData: MonthlyVelocityPoint[] = months.map((m) => {
    const monthLabel = format(m, "MMM yyyy")
    let revenue = 0
    let pipeline = 0

    proposalsList.forEach((p) => {
      if (isSameMonth(new Date(p.createdAt), m)) {
        const { total: convertedAmount } = convertAndAggregate(
          [{ amount: p.price, currency: p.currency }],
          targetCurrency,
          usdToInrRate
        )
        if (p.status === "accepted") {
          revenue += convertedAmount
        } else if (p.status === "sent") {
          pipeline += convertedAmount
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

  const monthlyAvgRevenue = Math.round(totalWon / 6)

  return (
    <DynamicAnalyticsHeroChartUI
      velocityData={velocityData}
      peakMonthLabel={peakMonthLabel}
      peakMonthRevenue={maxRevenue}
      monthlyAvgRevenue={monthlyAvgRevenue}
      totalWon={totalWon}
      currency={targetCurrency}
    />
  )
}
