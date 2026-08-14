import { headers } from "next/headers";
import { db } from "@/utils/db";
import { organization, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantContext } from "@/lib/tenant-context";

export async function fetchSidebarData() {
  const reqHeaders = await headers();
  const ctx = await getTenantContext(reqHeaders);

  if (!ctx.user || !ctx.organizationId) return undefined;

  const [fetchedOrg] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organizationId));

  if (!fetchedOrg) return undefined;

  return {
    ...fetchedOrg,
    logoUrl: fetchedOrg.logoUrl ?? undefined,
  };
}

export async function fetchTopbarData() {
  const reqHeaders = await headers();
  const ctx = await getTenantContext(reqHeaders);

  if (!ctx.user) return { hasClientProjects: false, firstClientProjectId: undefined };

  const clientProjectMemberships = await db
    .select({ projectId: projectMember.projectId })
    .from(projectMember)
    .where(and(eq(projectMember.userId, ctx.user.id), eq(projectMember.role, "client")));

  return {
    hasClientProjects: clientProjectMemberships.length > 0,
    firstClientProjectId: clientProjectMemberships[0]?.projectId,
  };
}