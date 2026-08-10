import { headers } from "next/headers"
import { db } from "@/utils/db"
import { project } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import {
  AnalyticsProjectTableClient,
  AnalyticsProjectPerformanceItem,
} from "./analytics-project-table-client"

export async function AnalyticsProjectTable() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  // Fetch raw projects with members, proposals, deliverables
  const rawProjects = await db.query.project.findMany({
    where: eq(project.organizationId, ctx.organizationId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      proposals: true,
      deliverables: true,
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
    limit: 10,
  })

  const projectsData: AnalyticsProjectPerformanceItem[] = rawProjects.map((p) => {
    const acceptedProposal = p.proposals.find((prop) => prop.status === "accepted")
    const latestProposal = p.proposals[0]

    const totalValue = acceptedProposal
      ? acceptedProposal.price
      : latestProposal
      ? latestProposal.price
      : null

    const proposalStatus = acceptedProposal
      ? "accepted"
      : latestProposal
      ? latestProposal.status
      : null

    const approvedDeliverables = p.deliverables.filter((d) => d.status === "approved").length
    const revisionRequests = p.deliverables.filter((d) => d.status === "revision_requested").length

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      totalValue,
      proposalStatus,
      approvedDeliverables,
      totalDeliverables: p.deliverables.length,
      revisionRequests,
      members: p.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
      })),
    }
  })

  return <AnalyticsProjectTableClient projects={projectsData} />
}
