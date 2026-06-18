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

    // Verify ownership
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member || member.role !== 'owner') {
      return { error: "Only the project owner can delete this project." };
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
