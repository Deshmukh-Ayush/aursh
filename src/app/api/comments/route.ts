import { db } from "@/utils/db";
import { comment, projectMember, deliverable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { projectId, body, deliverableId } = await req.json();

    if (!projectId || !body) {
      return NextResponse.json({ error: "Project ID and body are required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this project." }, { status: 403 });
    }

    let contextTitle = "project";
    if (deliverableId) {
      const [deliv] = await db.select().from(deliverable).where(eq(deliverable.id, deliverableId));
      if (!deliv || deliv.projectId !== projectId) {
        return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
      }
      contextTitle = deliv.title;
    }

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
      type: "comment_added" as any,
      metadata: { commentId: newComment.id, contextTitle }
    });


    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/discussions`);
    revalidatePath(`/projects/${projectId}/deliverables`);

    return NextResponse.json({ success: true, commentId: newComment.id });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [existingComment] = await db.select().from(comment).where(eq(comment.id, commentId));
    if (!existingComment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    const projectId = existingComment.projectId;

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this project." }, { status: 403 });
    }

    if (existingComment.userId !== userId && member.role !== 'owner') {
      return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
    }

    await db.delete(comment).where(eq(comment.id, commentId));

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/discussions`);
    revalidatePath(`/projects/${projectId}/deliverables`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment." }, { status: 500 });
  }
}
