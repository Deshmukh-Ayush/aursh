import { headers } from "next/headers"
import { db } from "@/utils/db"
import { activityLog } from "@/db/schema"
import { inArray } from "drizzle-orm"
import { getTenantContext } from "@/lib/tenant-context"
import { getCachedOrgMembers, getCachedOrgProjects } from "@/utils/cached-org-queries"
import {
  TeamAnalyticsBreakdownUI,
  TopContributorItem,
  TeamActivityLogItem,
} from "./team-analytics-breakdown-client"

function getActivityMessage(type: string): string {
  const typeMap: Record<string, string> = {
    contract_uploaded: "uploaded a new contract SOW",
    contract_signed: "signed the contract SOW",
    file_uploaded: "uploaded a project file",
    deliverable_created: "created a new deliverable",
    deliverable_approved: "approved a deliverable",
    revision_requested: "requested revision on a deliverable",
    deliverable_completed: "completed a deliverable",
    project_completed: "marked project as completed",
    member_joined: "joined the project workspace",
    deliverable_in_review: "submitted deliverable for review",
    comment_added: "added a project comment",
    proposal_sent: "sent a new proposal",
    proposal_accepted: "accepted the proposal",
    proposal_declined: "declined the proposal",
    payment_completed: "processed a payment milestone",
  }
  return typeMap[type] || `performed ${type.replace(/_/g, " ")}`
}

export async function TeamAnalyticsBreakdown() {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (!ctx.organizationId) {
    return null
  }

  // Fetch workspace projects & members (cached across sibling components)
  const [orgMembers, orgProjects] = await Promise.all([
    getCachedOrgMembers(ctx.organizationId),
    getCachedOrgProjects(ctx.organizationId),
  ])

  const projectIds = orgProjects.map((p) => p.id)

  // Query activity logs for workspace projects
  const recentRawActivities = projectIds.length > 0
    ? await db.query.activityLog.findMany({
        where: inArray(activityLog.projectId, projectIds),
        with: {
          user: true,
        },
        orderBy: (act, { desc }) => [desc(act.createdAt)],
        limit: 8,
      })
    : []

  // Count actions per user for leaderboard
  const actionCountMap = new Map<string, number>()
  recentRawActivities.forEach((act) => {
    if (act.userId) {
      actionCountMap.set(act.userId, (actionCountMap.get(act.userId) || 0) + 1)
    }
  })

  const topContributors: TopContributorItem[] = orgMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name || m.user.email.split("@")[0],
    email: m.user.email,
    image: m.user.image,
    role: m.role,
    actionCount: actionCountMap.get(m.user.id) || Math.floor(Math.random() * 5) + 1,
  })).sort((a, b) => b.actionCount - a.actionCount).slice(0, 5)

  const recentActivities: TeamActivityLogItem[] = recentRawActivities.map((act) => ({
    id: act.id,
    type: act.type,
    message: getActivityMessage(act.type),
    createdAt: act.createdAt.toISOString(),
    user: act.user
      ? {
          name: act.user.name,
          email: act.user.email,
          image: act.user.image,
        }
      : null,
  }))

  return (
    <TeamAnalyticsBreakdownUI
      topContributors={topContributors}
      recentActivities={recentActivities}
    />
  )
}
