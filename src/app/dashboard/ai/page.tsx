import { Suspense } from "react"
import { db } from "@/utils/db"
import { proposal, deliverable } from "@/db/schema"
import { inArray } from "drizzle-orm"
import { getCachedTenant } from "@/utils/cached-tenant"
import { getCachedOrg } from "@/utils/cached-org-queries"
import { getAccessibleProjects } from "@/lib/project-queries"
import { ScrunityAIView } from "@/components/dashboard/ai/scrunity-ai-view"
import Image from "next/image"

async function AIDataFetcher() {
  const { user, organizationId } = await getCachedTenant()
  if (!user) return null

  const [org, accessibleProjects] = await Promise.all([
    organizationId ? getCachedOrg(organizationId) : Promise.resolve(null),
    getAccessibleProjects(user.id, organizationId),
  ])

  const projectIds = accessibleProjects.map((p) => p.id)

  const [proposalsList, deliverablesList] = projectIds.length > 0
    ? await Promise.all([
        db.select({ price: proposal.price, status: proposal.status }).from(proposal).where(inArray(proposal.projectId, projectIds)),
        db.select({ status: deliverable.status }).from(deliverable).where(inArray(deliverable.projectId, projectIds)),
      ])
    : [[], []]

  const orgName = org?.name || "Workspace"
  const userName = user.name || undefined
  const workspaceSummary = {
    orgName,
    plan: org?.plan || "free",
    activeProjectsCount: accessibleProjects.filter((p) => p.status === "active").length,
    totalProjectsCount: accessibleProjects.length,
    inReviewDeliverablesCount: deliverablesList.filter((d) => d.status === "in_review" || d.status === "pending").length,
    totalProposalValue: proposalsList.filter((p) => p.status === "accepted").reduce((acc, p) => acc + p.price, 0),
    projects: accessibleProjects.map((p) => ({ id: p.id, name: p.name })),
  }

  return (
    <ScrunityAIView
      orgName={orgName}
      userName={userName}
      projects={workspaceSummary.projects}
      workspaceSummary={workspaceSummary}
    />
  )
}

// 2. The Skeleton (Shows instantly inside the shell)
function AISkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center p-6 space-y-3 h-full w-full">
      <Image
        src="/logo/scrunity_logo_svg.svg"
        alt="Torch"
        width={44}
        height={44}
        className="animate-pulse dark:invert"
      />
      <div className="space-y-3 flex flex-col items-center mt-2">
        <div className="h-5 w-64 bg-muted rounded-md animate-pulse"></div>
        <div className="h-3 w-80 bg-muted rounded-md animate-pulse"></div>
      </div>
    </div>
  )
}

export default function DashboardAIPage() {
  return (
    <div className="flex flex-col flex-1 w-full max-w-5xl mx-auto pb-4">
      <Suspense fallback={<AISkeleton />}>
        <AIDataFetcher />
      </Suspense>
    </div>
  )
}
