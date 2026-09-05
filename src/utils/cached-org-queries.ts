import { cache } from "react";
import { db } from "@/utils/db";
import { project, member, user, organization, activityLog } from "@/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";

export const getCachedOrg = cache(async (organizationId: string) => {
  if (!organizationId) return null;
  const [org] = await db.select().from(organization).where(eq(organization.id, organizationId));
  return org;
});

export const getCachedOrgProjects = cache(async (organizationId: string) => {
  if (!organizationId) return [];
  return db.select({ id: project.id }).from(project).where(eq(project.organizationId, organizationId));
});

export const getCachedOrgMembers = cache(async (organizationId: string) => {
  if (!organizationId) return [];
  return db
    .select({
      id: member.id,
      role: member.role,
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId));
});

export const getCachedRecentActivity = cache(async (projectIdsKey: string, sinceDateIso: string) => {
  const projectIds = projectIdsKey ? projectIdsKey.split(",").filter(Boolean) : [];
  if (projectIds.length === 0) return [];
  const sinceDate = new Date(sinceDateIso);
  return db
    .select({ createdAt: activityLog.createdAt })
    .from(activityLog)
    .where(
      and(
        inArray(activityLog.projectId, projectIds),
        gte(activityLog.createdAt, sinceDate)
      )
    );
});
