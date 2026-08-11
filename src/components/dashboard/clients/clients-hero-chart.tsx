import { headers } from "next/headers"
import { db } from "@/utils/db"
import { project, proposal, contract } from "@/db/schema"
import { eq, inArray, gte, and } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthlyClientConversionPoint } from "./clients-hero-chart-client"

const DynamicClientsHeroChartUI = dynamic(
  () => import("./clients-hero-chart-client").then((mod) => mod.ClientsHeroChartUI),
  {
    loading: () => <Skeleton className="h-[380px] w-full rounded-2xl" />,
  }
)

export async function ClientsHeroChart() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  const today = new Date()
  const sixMonthsAgo = startOfMonth(subMonths(today, 5))

  const orgProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.organizationId, ctx.organizationId))

  const projectIds = orgProjects.map((p) => p.id)

  if (projectIds.length === 0) {
    const emptyChart: MonthlyClientConversionPoint[] = Array.from({ length: 6 }, (_, i) => ({
      month: format(subMonths(today, 5 - i), "MMM yyyy"),
      proposalsSent: 0,
      clientsClosed: 0,
    }))
    return (
      <DynamicClientsHeroChartUI
        conversionData={emptyChart}
        totalProposalsSent={0}
        totalClientsClosed={0}
        avgConversionRate={0}
      />
    )
  }

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

  const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i))

  let totalProposalsSent = 0
  let totalClientsClosed = 0

  const conversionData: MonthlyClientConversionPoint[] = months.map((m) => {
    const monthLabel = format(m, "MMM yyyy")
    let proposalsSent = 0
    let clientsClosed = 0

    proposalsList.forEach((p) => {
      if (isSameMonth(new Date(p.createdAt), m)) {
        proposalsSent++
        if (p.status === "accepted") {
          clientsClosed++
        }
      }
    })

    contractsList.forEach((c) => {
      if (isSameMonth(new Date(c.createdAt), m)) {
        if (c.status === "signed" || c.status === "fully_signed") {
          clientsClosed++
        }
      }
    })

    totalProposalsSent += proposalsSent
    totalClientsClosed += clientsClosed

    return {
      month: monthLabel,
      proposalsSent,
      clientsClosed,
    }
  })

  const avgConversionRate = totalProposalsSent > 0 ? Math.round((totalClientsClosed / totalProposalsSent) * 100) : 0

  return (
    <DynamicClientsHeroChartUI
      conversionData={conversionData}
      totalProposalsSent={totalProposalsSent}
      totalClientsClosed={totalClientsClosed}
      avgConversionRate={avgConversionRate}
    />
  )
}
