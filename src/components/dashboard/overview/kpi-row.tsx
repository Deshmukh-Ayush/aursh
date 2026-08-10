import { db } from "@/utils/db"
import { project, contract, proposal } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { headers } from "next/headers"
import { DashboardKpiRowUI } from "./kpi-row-client"

export async function DashboardKpiRow() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  // Fetch active projects
  const activeProjects = await db
    .select()
    .from(project)
    .where(and(eq(project.organizationId, ctx.organizationId), eq(project.status, "active")))

  // Fetch accepted proposal values for signed contracts
  const orgProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.organizationId, ctx.organizationId))
    
  const projectIds = orgProjects.map((p) => p.id)

  let totalIncome = 0

  if (projectIds.length > 0) {
    const signedContracts = await db
      .select({ projectId: contract.projectId })
      .from(contract)
      .where(and(inArray(contract.projectId, projectIds), inArray(contract.status, ["signed", "fully_signed"])))

    const signedProjectIds = signedContracts.map((c) => c.projectId)

    if (signedProjectIds.length > 0) {
      const acceptedProposals = await db
        .select({ price: proposal.price })
        .from(proposal)
        .where(and(inArray(proposal.projectId, signedProjectIds), eq(proposal.status, "accepted")))

      totalIncome = acceptedProposals.reduce((sum, p) => sum + p.price, 0)
    }
  }

  // Pure, deterministic trend data for the mini charts
  const trendData1 = [
    { day: 1, value: 30 },
    { day: 2, value: 45 },
    { day: 3, value: 40 },
    { day: 4, value: 65 },
    { day: 5, value: 55 },
    { day: 6, value: 80 },
    { day: 7, value: 75 },
  ]
  const trendData2 = [
    { day: 1, value: 2 },
    { day: 2, value: 4 },
    { day: 3, value: 3 },
    { day: 4, value: 5 },
    { day: 5, value: 5 },
    { day: 6, value: 7 },
    { day: 7, value: activeProjects.length || 8 },
  ]

  return (
    <DashboardKpiRowUI
      totalIncome={totalIncome}
      activeProjectsCount={activeProjects.length}
      trendData1={trendData1}
      trendData2={trendData2}
    />
  )
}
