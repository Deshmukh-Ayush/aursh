import { headers } from "next/headers"
import { db } from "@/utils/db"
import { organization, member, activityLog, project } from "@/db/schema"
import { eq, inArray, gte, and } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { subDays } from "date-fns"
import { TeamKpiRowClient, TeamKpiData } from "./team-kpi-row-client"

export async function TeamKpiRow() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  const today = new Date()
  const sevenDaysAgo = subDays(today, 6)
  const thirtyDaysAgo = subDays(today, 29)

  // Concurrent queries for org plan, members, and workspace projects (Promise.all)
  const [[org], orgMembers, orgProjects] = await Promise.all([
    db.select().from(organization).where(eq(organization.id, ctx.organizationId)),
    db.select().from(member).where(eq(member.organizationId, ctx.organizationId)),
    db.select({ id: project.id }).from(project).where(eq(project.organizationId, ctx.organizationId)),
  ])

  const projectIds = orgProjects.map((p) => p.id)

  // Query activity logs concurrently if projects exist
  const [recentActivities, monthlyActivities] = projectIds.length > 0
    ? await Promise.all([
        db
          .select({ userId: activityLog.userId })
          .from(activityLog)
          .where(and(inArray(activityLog.projectId, projectIds), gte(activityLog.createdAt, sevenDaysAgo))),
        db
          .select({ id: activityLog.id })
          .from(activityLog)
          .where(and(inArray(activityLog.projectId, projectIds), gte(activityLog.createdAt, thirtyDaysAgo))),
      ])
    : [[], []]

  // Seat capacity based on plan
  const plan = org?.plan || "free"
  const maxSeats = plan === "agency" ? 25 : plan === "freelancer" ? 5 : 3
  const activeSeats = orgMembers.length

  // Role distribution
  let ownerCount = 0
  let memberCount = 0

  orgMembers.forEach((m) => {
    if (m.role === "owner" || m.role === "admin") {
      ownerCount++
    } else {
      memberCount++
    }
  })

  // Active contributors in last 7 days
  const activeUserSet = new Set(recentActivities.map((a) => a.userId).filter(Boolean))
  const activeContributors = activeUserSet.size || (activeSeats > 0 ? 1 : 0)

  const kpiData: TeamKpiData = {
    activeSeats,
    maxSeats,
    activeContributors,
    ownerCount,
    adminCount: 0,
    memberCount,
    teamPace: monthlyActivities.length,
  }

  return <TeamKpiRowClient data={kpiData} />
}
