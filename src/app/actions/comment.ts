"use server";

import { db } from "@/utils/db";
import { comment, project, projectMember, deliverable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

export async function createCommentAction(projectId: string, body: string, deliverableId?: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Verify membership
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return { error: "You are not a member of this project." };
    }

    // Optional: Get deliverable title if it's a deliverable comment
    let contextTitle = "project";
    if (deliverableId) {
      const [deliv] = await db.select().from(deliverable).where(eq(deliverable.id, deliverableId));
      if (!deliv || deliv.projectId !== projectId) {
        return { error: "Deliverable not found" };
      }
      contextTitle = deliv.title;
    }

    // Note: We deliberately allow comments on 'completed' projects.

    const [newComment] = await db.insert(comment).values({
      id: crypto.randomUUID(),
      projectId,
      deliverableId: deliverableId || null,
      userId,
      body
    }).returning();

    await logActivity({
      projectId,
      userId,
      type: "comment_added" as any, // Need to make sure this is added to schema enum if needed
      metadata: { commentId: newComment.id, contextTitle }
    });

    const otherMembers = await db
      .select()
      .from(projectMember)
      .where(eq(projectMember.projectId, projectId));

    for (const m of otherMembers) {
      if (m.userId === userId) continue;
      await createNotification(
        m.userId,
        projectId,
        "comment_added" as any,
        `${session.user.name || "A user"} commented on ${contextTitle === "project" ? "the project" : `"${contextTitle}"`}: "${body.substring(0, 50)}${body.length > 50 ? '...' : ''}"`
      );
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/discussions`);
    revalidatePath(`/projects/${projectId}/deliverables`);

    return { success: true, commentId: newComment.id };
  } catch (error) {
    console.error("Create comment error:", error);
    return { error: "Failed to create comment." };
  }
}

export async function deleteCommentAction(commentId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const [existingComment] = await db.select().from(comment).where(eq(comment.id, commentId));
    if (!existingComment) return { error: "Comment not found" };

    const projectId = existingComment.projectId;

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return { error: "You are not a member of this project." };
    }

    if (existingComment.userId !== userId && member.role !== 'owner') {
      return { error: "You can only delete your own comments." };
    }

    await db.delete(comment).where(eq(comment.id, commentId));

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/discussions`);
    revalidatePath(`/projects/${projectId}/deliverables`);

    return { success: true };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { error: "Failed to delete comment." };
  }
}
