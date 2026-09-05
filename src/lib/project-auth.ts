import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import { project, projectMember, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface ProjectAccessResult {
  proj: typeof project.$inferSelect | null;
  role: "agency" | "client" | "owner" | null;
  isAuthorized: boolean;
}

export const getProjectAccess = cache(async (
  projectId: string,
  userId?: string,
  reqHeaders?: Headers
): Promise<ProjectAccessResult> => {
  if (!projectId) {
    return { proj: null, role: null, isAuthorized: false };
  }

  // Fast path: derive authorization and role directly from verified proxy request headers.
  // All permission decisions are derived solely from the single x-project-role value.
  let h: Headers | null = reqHeaders ?? null;
  if (!h && typeof window === "undefined") {
    try {
      h = await headers();
    } catch {
      h = null;
    }
  }

  if (h) {
    const headerProjectId = h.get("x-project-id");
    const headerRole = h.get("x-project-role");

    if (
      headerProjectId === projectId &&
      (headerRole === "owner" || headerRole === "agency" || headerRole === "client")
    ) {
      const headerProjectName = h.get("x-project-name");
      const headerOrgId = h.get("x-project-org-id");

      return {
        proj: {
          id: projectId,
          name: headerProjectName ? decodeURIComponent(headerProjectName) : "",
          organizationId: headerOrgId || null,
        } as typeof project.$inferSelect,
        role: headerRole,
        isAuthorized: true,
      };
    }
  }

  // Fallback path: when headers are absent (e.g. background tasks, CLI, direct invocations)
  if (!userId) {
    return { proj: null, role: null, isAuthorized: false };
  }

  const [proj] = await db.select().from(project).where(eq(project.id, projectId));
  if (!proj) {
    return { proj: null, role: null, isAuthorized: false };
  }

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

  return { proj, role: null, isAuthorized: false };
});

export function canManageProject(role: ProjectAccessResult["role"]): boolean {
  return role === "owner" || role === "agency";
}