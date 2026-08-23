import { Suspense } from "react"
import { db } from "@/utils/db"
import { project, proposal, deliverable } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { getCachedTenant } from "@/utils/cached-tenant"
import { getCachedOrg } from "@/utils/cached-org-queries"
import { ScrunityAIView } from "@/components/dashboard/ai/scrunity-ai-view"
import { Brain } from "lucide-react"

async function AIDataFetcher() {
  const { organizationId } = await getCachedTenant()
  if (!organizationId) return null

  const [org, orgProjects] = await Promise.all([
    getCachedOrg(organizationId),
    db.select({ id: project.id, name: project.name, status: project.status })
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
  const workspaceSummary = {
    orgName,
    plan: org?.plan || "free",
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

// 2. The Skeleton (Shows instantly inside the shell)
function AISkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center p-6 space-y-3 h-full w-full">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand animate-pulse">
        <Brain className="h-5 w-5" />
      </div>
      <div className="space-y-3 flex flex-col items-center mt-2">
        <div className="h-5 w-64 bg-muted rounded-md animate-pulse"></div>
        <div className="h-3 w-80 bg-muted rounded-md animate-pulse"></div>
      </div>
    </div>
  )
}

export default function DashboardAIPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-4xl mx-auto space-y-4">
      <Suspense fallback={<AISkeleton />}>
        <AIDataFetcher />
      </Suspense>
    </div>
  )
}
