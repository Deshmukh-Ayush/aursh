import { db } from "@/utils/db";
import { project, projectMember } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Returns all project IDs that a user has access to, including:
 * 1. Projects belonging to the user's active organization.
 * 2. Projects where the user is an explicit project member (e.g. as a client or collaborator).
 */
export async function getAccessibleProjectIds(
  userId: string,
  organizationId?: string | null
): Promise<string[]> {
  if (!userId) return [];

  const userMemberships = await db
    .select({ projectId: projectMember.projectId })
    .from(projectMember)
    .where(eq(projectMember.userId, userId));
  const memberProjectIds = userMemberships.map((m) => m.projectId);

  if (!organizationId) {
    return memberProjectIds;
  }

  const orgProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.organizationId, organizationId));
  const orgProjectIds = orgProjects.map((p) => p.id);

  // Return deduplicated union of project IDs
  return Array.from(new Set([...orgProjectIds, ...memberProjectIds]));
}

/**
 * Returns all rich Project records that a user has access to,
 * joining members, contracts, proposals, and deliverables.
 */
export async function getAccessibleProjects(
  userId: string,
  organizationId?: string | null
) {
  const projectIds = await getAccessibleProjectIds(userId, organizationId);
  if (projectIds.length === 0) return [];

  return await db.query.project.findMany({
    where: (p, { inArray }) => inArray(p.id, projectIds),
    with: {
      members: {
        with: { user: true },
      },
      contracts: true,
      proposals: true,
      deliverables: true,
    },
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  });
}
