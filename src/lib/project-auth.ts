import { db } from "@/utils/db";
import { project, projectMember, member, user as userTable, projectInvitation } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface ProjectAccessResult {
  proj: typeof project.$inferSelect | null;
  role: "agency" | "client" | "owner" | null;
  isAuthorized: boolean;
}

/**
 * Root Authorization Resolver for Projects.
 * Solves cookie vs session activeOrganizationId mismatches by querying database
 * membership directly (explicit projectMember OR org member table).
 */
export async function getProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectAccessResult> {
  if (!projectId || !userId) {
    return { proj: null, role: null, isAuthorized: false };
  }

  // 1. Fetch project by ID
  const [proj] = await db.select().from(project).where(eq(project.id, projectId));
  if (!proj) {
    return { proj: null, role: null, isAuthorized: false };
  }

  // 2. Check explicit projectMember table assignment
  const [pm] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

  if (pm) {
    return {
      proj,
      role: pm.role as "agency" | "client" | "owner",
      isAuthorized: true,
    };
  }

  // 3. Check organization database membership (solves missing activeOrganizationId cookie session)
  if (proj.organizationId) {
    const [orgMem] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, proj.organizationId), eq(member.userId, userId)));

    if (orgMem) {
      return {
        proj,
        role: "agency",
        isAuthorized: true,
      };
    }
  }

  // 4. Fallback check: check user's email against project invitations or signatures
  const [usr] = await db.select().from(userTable).where(eq(userTable.id, userId));
  if (usr?.email) {
    const [inv] = await db
      .select()
      .from(projectInvitation)
      .where(and(eq(projectInvitation.projectId, projectId), eq(projectInvitation.email, usr.email)));

    if (inv) {
      // Auto-heal missing projectMember record
      try {
        await db.insert(projectMember).values({
          id: crypto.randomUUID(),
          projectId,
          userId,
          role: (inv.role as "client" | "agency") || "client",
        });
      } catch {
        // Ignore duplicate insert errors
      }

      return {
        proj,
        role: (inv.role as "client" | "agency") || "client",
        isAuthorized: true,
      };
    }
  }

  return { proj, role: null, isAuthorized: false };
}
