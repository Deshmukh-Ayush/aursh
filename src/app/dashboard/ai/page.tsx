import { headers } from "next/headers"
import { db } from "@/utils/db"
import { organization, project, proposal, deliverable } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { ScrunityAIView } from "@/components/dashboard/ai/scrunity-ai-view"

export default async function DashboardAIPage() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  // Concurrent queries for organization details, projects, proposals, and deliverables (Promise.all)
  const [[org], orgProjects] = await Promise.all([
    db.select().from(organization).where(eq(organization.id, ctx.organizationId)),
    db
      .select({ id: project.id, name: project.name, status: project.status })
      .from(project)
      .where(eq(project.organizationId, ctx.organizationId)),
  ])

  const projectIds = orgProjects.map((p) => p.id)

  const [proposalsList, deliverablesList] = projectIds.length > 0
    ? await Promise.all([
        db.select({ price: proposal.price, currency: proposal.currency, status: proposal.status }).from(proposal).where(inArray(proposal.projectId, projectIds)),
        db.select({ status: deliverable.status }).from(deliverable).where(inArray(deliverable.projectId, projectIds)),
      ])
    : [[], []]

  const orgName = org?.name || "Workspace"
  const plan = org?.plan || "free"

  const activeProjectsCount = orgProjects.filter((p) => p.status === "active").length
  const inReviewDeliverablesCount = deliverablesList.filter((d) => d.status === "in_review" || d.status === "pending").length
  const totalProposalValue = proposalsList.filter((p) => p.status === "accepted").reduce((acc, p) => acc + p.price, 0)

  const workspaceSummary = {
    orgName,
    plan,
    activeProjectsCount,
    totalProjectsCount: orgProjects.length,
    inReviewDeliverablesCount,
    totalProposalValue,
    projects: orgProjects.map((p) => ({ id: p.id, name: p.name })),
  }

  return (
    <ScrunityAIView
      orgName={orgName}
      projects={orgProjects.map((p) => ({ id: p.id, name: p.name }))}
      workspaceSummary={workspaceSummary}
    />
  )
}
