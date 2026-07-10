"use server"

import { db } from "@/utils/db";
import { project, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";

// Helper to check ownership
async function checkProjectOwnership(projectId: string, userId: string, sessionOrgId?: string | null) {
  const [proj] = await db.select().from(project).where(eq(project.id, projectId));
  if (!proj) return { error: "Project not found", proj: null, role: null };

  let role: "agency" | "client" | "owner" | null = null;
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

  if (member) {
    role = member.role as "agency" | "client" | "owner";
  } else if (sessionOrgId === proj.organizationId) {
    role = "agency";
  }

  if (!role || (role !== 'owner' && role !== 'agency')) {
    return { error: "Insufficient permissions.", proj, role };
  }

  return { proj, role };
}

export async function deleteProjectAction(projectId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const { error } = await checkProjectOwnership(projectId, session.user.id, session.session?.activeOrganizationId);
    if (error) return { error: "Only the project owner or agency can delete this project." };

    // Delete the project (Cascade deletion will handle members, contracts, files, etc)
    await db.delete(project).where(eq(project.id, projectId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { error: "Failed to delete project." };
  }
}

export async function markProjectCompleteAction(projectId: string) {
  // Legacy alias, preserved in case it's used elsewhere
  return updateProjectStatusAction(projectId, "completed");
}

export async function updateProjectStatusAction(projectId: string, status: "active" | "completed") {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const { error } = await checkProjectOwnership(projectId, session.user.id, session.session?.activeOrganizationId);
    if (error) return { error: "Only the project owner or agency can update the status." };

    await db.update(project).set({ status }).where(eq(project.id, projectId));

    await logActivity({
      projectId,
      userId: session.user.id,
      type: status === "completed" ? "project_completed" : "member_joined" // 'member_joined' is placeholder since we don't have project_reactivated
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Update project status error:", error);
    return { error: "Failed to update status." };
  }
}

export async function renameProjectAction(projectId: string, newName: string) {
  try {
    if (!newName.trim()) return { error: "Project name cannot be empty." };

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const { error } = await checkProjectOwnership(projectId, session.user.id, session.session?.activeOrganizationId);
    if (error) return { error: "Only the project owner or agency can rename this project." };

    await db.update(project).set({ name: newName.trim() }).where(eq(project.id, projectId));

    // Revalidate paths that show project name
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Rename project error:", error);
    return { error: "Failed to rename project." };
  }
}

export async function removeMemberAction(projectId: string, targetUserId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const { error } = await checkProjectOwnership(projectId, session.user.id, session.session?.activeOrganizationId);
    if (error) return { error: "Only the project owner or agency can remove members." };

    // Check if target is not the owner (cannot remove the project creator)
    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (proj?.createdBy === targetUserId) {
      return { error: "Cannot remove the project creator." };
    }

    await db.delete(projectMember).where(and(
      eq(projectMember.projectId, projectId),
      eq(projectMember.userId, targetUserId)
    ));

    revalidatePath(`/projects/${projectId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Remove member error:", error);
    return { error: "Failed to remove member." };
  }
}
