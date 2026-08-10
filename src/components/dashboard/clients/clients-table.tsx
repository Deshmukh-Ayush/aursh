import { headers } from "next/headers"
import { db } from "@/utils/db"
import { project, projectMember, user, invitation, proposal } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { ClientsTableClient, ClientTableItem } from "./clients-table-client"

export async function ClientsTable() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  // Fetch workspace projects
  const orgProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.organizationId, ctx.organizationId))

  const projectIds = orgProjects.map((p) => p.id)

  // Concurrent queries for client members, invitations, proposals (Promise.all)
  const [clientMembers, pendingInvites, proposalsList] = await Promise.all([
    projectIds.length > 0
      ? db
          .select({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userImage: user.image,
            projectId: projectMember.projectId,
            role: projectMember.role,
            createdAt: projectMember.createdAt,
          })
          .from(projectMember)
          .innerJoin(user, eq(projectMember.userId, user.id))
          .where(and(inArray(projectMember.projectId, projectIds), eq(projectMember.role, "client")))
      : [],
    db
      .select()
      .from(invitation)
      .where(and(eq(invitation.organizationId, ctx.organizationId), eq(invitation.status, "pending"))),
    projectIds.length > 0
      ? db
          .select({
            projectId: proposal.projectId,
            price: proposal.price,
            status: proposal.status,
          })
          .from(proposal)
          .where(inArray(proposal.projectId, projectIds))
      : [],
  ])

  // Build client items
  const clientMap = new Map<string, ClientTableItem>()

  // Process active clients
  clientMembers.forEach((m) => {
    const existing = clientMap.get(m.userEmail)
    const projectProposals = proposalsList.filter((p) => p.projectId === m.projectId)
    const acceptedVal = projectProposals
      .filter((p) => p.status === "accepted")
      .reduce((sum, p) => sum + p.price, 0)

    if (existing) {
      existing.activeProjectsCount += 1
      existing.totalContractValue += acceptedVal
    } else {
      clientMap.set(m.userEmail, {
        id: m.userId,
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
        status: "active",
        activeProjectsCount: 1,
        totalContractValue: acceptedVal,
        joinedDate: m.createdAt.toISOString(),
        projectId: m.projectId,
      })
    }
  })

  // Process invited clients
  pendingInvites.forEach((inv) => {
    if (!clientMap.has(inv.email)) {
      clientMap.set(inv.email, {
        id: inv.id,
        name: null,
        email: inv.email,
        image: null,
        status: "invited",
        activeProjectsCount: 0,
        totalContractValue: 0,
        joinedDate: inv.createdAt.toISOString(),
        projectId: null,
      })
    }
  })

  const clientsData = Array.from(clientMap.values())

  return <ClientsTableClient clients={clientsData} />
}
