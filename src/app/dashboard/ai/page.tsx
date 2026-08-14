import { db } from "@/utils/db"
import { organization, project, proposal, deliverable } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { getCachedTenant } from "@/utils/cached-tenant"
import { ScrunityAIView } from "@/components/dashboard/ai/scrunity-ai-view"

export default async function DashboardAIPage() {
  const { organizationId } = await getCachedTenant()

  if (!organizationId) return null

  const [org, orgProjects] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, organizationId)
    }),
    db
      .select({ id: project.id, name: project.name, status: project.status })
      .from(project)
      .where(eq(project.organizationId, organizationId)),
  ])

  const projectIds = orgProjects.map((p) => p.id)

  const [proposalsList, deliverablesList] = projectIds.length > 0
    ? await Promise.all([
        db.select({ price: proposal.price, status: proposal.status }).from(proposal).where(inArray(proposal.projectId, projectIds)),
        db.select({ status: deliverable.status }).from(deliverable).where(inArray(deliverable.projectId, projectIds)),
      ])
    : [[], []]

  const orgName = org?.name || "Workspace"
  const plan = org?.plan || "free"

  const workspaceSummary = {
    orgName,
    plan,
    activeProjectsCount: orgProjects.filter((p) => p.status === "active").length,
    totalProjectsCount: orgProjects.length,
    inReviewDeliverablesCount: deliverablesList.filter((d) => d.status === "in_review" || d.status === "pending").length,
    totalProposalValue: proposalsList.filter((p) => p.status === "accepted").reduce((acc, p) => acc + p.price, 0),
    projects: orgProjects.map((p) => ({ id: p.id, name: p.name })),
  }

  return (
    <ScrunityAIView
      orgName={orgName}
      projects={workspaceSummary.projects}
      workspaceSummary={workspaceSummary}
    />
  )
}