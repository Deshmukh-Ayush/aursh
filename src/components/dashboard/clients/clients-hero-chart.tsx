import { headers } from "next/headers"
import { db } from "@/utils/db"
import { project, proposal, contract } from "@/db/schema"
import { eq, inArray, gte, and } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns"
import { ClientsHeroChartUI, MonthlyClientConversionPoint } from "./clients-hero-chart-client"

export async function ClientsHeroChart() {
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
      sent: 0,
      closed: 0,
    }))
    return (
      <ClientsHeroChartUI
        chartData={emptyChart}
        totalSent={0}
        totalClosed={0}
        conversionRate={0}
      />
    )
  }

  // Execute concurrent queries (Vercel async-parallel rule)
  const [proposalsList, contractsList] = await Promise.all([
    db
      .select({
        status: proposal.status,
        createdAt: proposal.createdAt,
      })
      .from(proposal)
      .where(and(inArray(proposal.projectId, projectIds), gte(proposal.createdAt, sixMonthsAgo))),
    db
      .select({
        status: contract.status,
        createdAt: contract.createdAt,
      })
      .from(contract)
      .where(and(inArray(contract.projectId, projectIds), gte(contract.createdAt, sixMonthsAgo))),
  ])

  // Generate 6 monthly buckets
  const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))

  let totalSent = 0
  let totalClosed = 0

  const chartData: MonthlyClientConversionPoint[] = months.map((m) => {
    const monthLabel = format(m, "MMM yyyy")
    let sent = 0
    let closed = 0

    proposalsList.forEach((p) => {
      if (isSameMonth(new Date(p.createdAt), m)) {
        sent++
        if (p.status === "accepted") {
          closed++
        }
      }
    })

    contractsList.forEach((c) => {
      if (isSameMonth(new Date(c.createdAt), m)) {
        if (c.status === "signed" || c.status === "fully_signed") {
          closed++
        }
      }
    })

    totalSent += sent
    totalClosed += closed

    return {
      month: monthLabel,
      sent,
      closed,
    }
  })

  const conversionRate = totalSent > 0 ? Math.round((totalClosed / totalSent) * 100) : 0

  return (
    <ClientsHeroChartUI
      chartData={chartData}
      totalSent={totalSent}
      totalClosed={totalClosed}
      conversionRate={conversionRate}
    />
  )
}
