import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/utils/db"
import { project, contract, proposal, deliverable, projectMember, user } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { ProjectsTableClient, ProjectTableItem } from "@/components/dashboard/projects/projects-table-client"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export default async function DashboardProjectsPage() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (ctx.error || !ctx.user) {
    redirect("/sign-in")
  }

  if (!ctx.organizationId) {
    return null
  }

  // Fetch all projects for the organization
  const rawProjects = await db.query.project.findMany({
    where: eq(project.organizationId, ctx.organizationId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      contracts: true,
      proposals: true,
      deliverables: true,
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  })

  // Format data into clean serializable props for the client table
  const projectsData: ProjectTableItem[] = rawProjects.map((p) => {
    // Determine accepted contract value from accepted proposals
    const acceptedProposal = p.proposals.find((prop) => prop.status === "accepted")
    const contractValue = acceptedProposal ? acceptedProposal.price : null

    // Determine latest contract status
    const latestContract = p.contracts[0]
    const contractStatus = latestContract ? latestContract.status : null

    // Deliverable stats
    const totalDeliverables = p.deliverables.length
    const approvedDeliverables = p.deliverables.filter((d) => d.status === "approved").length

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
      contractValue,
      contractStatus,
      deliverableStats: {
        total: totalDeliverables,
        approved: approvedDeliverables,
      },
    }
  })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Header */}
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

      {/* Projects Table */}
      <ProjectsTableClient projects={projectsData} />
    </div>
  )
}
