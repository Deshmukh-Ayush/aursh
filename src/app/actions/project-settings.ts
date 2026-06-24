"use server"

import { db } from "@/utils/db";
import { project, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteProjectAction(projectId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return { error: "Project not found" };

    let role: "agency" | "client" | "owner" | null = null;
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));

    if (member) {
      role = member.role as "agency" | "client" | "owner";
    } else if (session.session?.activeOrganizationId === proj.organizationId) {
      role = "agency";
    }

    if (!role || (role !== 'owner' && role !== 'agency')) {
      return { error: "Only the project owner or agency can delete this project." };
    }

    // Delete the project (Cascade deletion will handle members, contracts, files, etc)
    await db.delete(project).where(eq(project.id, projectId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { error: "Failed to delete project." };
  }
}

import { logActivity } from "@/lib/activity";

export async function markProjectCompleteAction(projectId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return { error: "Project not found" };

    let role: "agency" | "client" | "owner" | null = null;
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));

    if (member) {
      role = member.role as "agency" | "client" | "owner";
    } else if (session.session?.activeOrganizationId === proj.organizationId) {
      role = "agency";
    }

    if (!role || (role !== 'owner' && role !== 'agency')) {
      return { error: "Only the project owner or agency can complete the project." };
    }

    await db.update(project).set({ status: 'completed' }).where(eq(project.id, projectId));

    await logActivity({
      projectId,
      userId,
      type: "project_completed"
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Complete project error:", error);
    return { error: "Failed to complete project." };
  }
}
