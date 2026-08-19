import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/utils/db"
import { project } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getCachedTenant } from "@/utils/cached-tenant"
import { ProjectsTableClient, ProjectTableItem } from "@/components/dashboard/projects/projects-table-client"
import { CreateProjectDialog } from "@/components/create-project-dialog"

async function ProjectsData() {
  const { organizationId } = await getCachedTenant()
  if (!organizationId) return null

  const rawProjects = await db.query.project.findMany({
    where: eq(project.organizationId, organizationId),
    with: {
      members: {
        with: { user: true },
      },
      contracts: true,
      proposals: true,
      deliverables: true,
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  })

  const projectsData: ProjectTableItem[] = rawProjects.map((p) => {
    const acceptedProposal = p.proposals.find((prop) => prop.status === "accepted")
    const latestContract = p.contracts[0]
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      members: p.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
      })),
      contractValue: acceptedProposal ? acceptedProposal.price : null,
      contractStatus: latestContract ? latestContract.status : null,
      deliverableStats: {
        total: p.deliverables.length,
        approved: p.deliverables.filter((d) => d.status === "approved").length,
      },
    }
  })

  return <ProjectsTableClient projects={projectsData} />
}

export default function DashboardProjectsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage contracts, deliverables, and client collaboration across your workspace.
          </p>
        </div>
        <div className="shrink-0">
          <CreateProjectDialog />
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
        <ProjectsData />
      </Suspense>
    </div>
  )
}