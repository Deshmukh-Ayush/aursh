import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import { torchConversation, torchMessage } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      conversationId,
      id: messageId,
      role,
      content,
      toolCalls,
      artifact,
    } = await req.json();

    if (!conversationId || !role || content === undefined) {
      return NextResponse.json(
        { error: "conversationId, role, and content are required." },
        { status: 400 }
      );
    }

    // Verify conversation belongs to this user and organization
    const conv = await db.query.torchConversation.findFirst({
      where: and(
        eq(torchConversation.id, conversationId),
        eq(torchConversation.organizationId, organizationId),
        eq(torchConversation.userId, user.id)
      ),
    });

    if (!conv) {
      return NextResponse.json(
        { error: "Conversation not found or unauthorized." },
        { status: 404 }
      );
    }

    const finalId = messageId || crypto.randomUUID();

    const [savedMsg] = await db
      .insert(torchMessage)
      .values({
        id: finalId,
        conversationId,
        role,
        content: content || "",
        reasoningSteps: toolCalls && toolCalls.length > 0 ? toolCalls : null,
        artifact: artifact || null,
      })
      .returning();

    // Update conversation updatedAt (and set title if first user prompt)
    const updateData: { updatedAt: Date; title?: string } = {
      updatedAt: new Date(),
    };
    if (!conv.title && role === "user" && content) {
      const cleanTitle = content.trim().replace(/\n+/g, " ").slice(0, 60);
      updateData.title = cleanTitle.length === 60 ? `${cleanTitle}…` : cleanTitle;
    }

    await db
      .update(torchConversation)
      .set(updateData)
      .where(eq(torchConversation.id, conversationId));

    return NextResponse.json({ message: savedMsg });
  } catch (error) {
    console.error("[Torch Save Message Error]:", error);
    return NextResponse.json(
      { error: "Failed to save message." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, status } = await req.json();

    if (!messageId || !status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "messageId and valid status ('approved' | 'rejected' | 'pending') required." },
        { status: 400 }
      );
    }

    // Fetch the message and verify tenant ownership via conversation
    const msg = await db.query.torchMessage.findFirst({
      where: eq(torchMessage.id, messageId),
      with: {
        conversation: true,
      },
    });

    if (
      !msg ||
      !msg.conversation ||
      msg.conversation.organizationId !== organizationId ||
      msg.conversation.userId !== user.id
    ) {
      return NextResponse.json(
        { error: "Message not found or unauthorized." },
        { status: 404 }
      );
    }

    if (!msg.artifact) {
      return NextResponse.json(
        { error: "Message has no artifact to update." },
        { status: 400 }
      );
    }

    const updatedArtifact = {
      ...(msg.artifact as Record<string, unknown>),
      status,
    };

    const [updated] = await db
      .update(torchMessage)
      .set({ artifact: updatedArtifact })
      .where(eq(torchMessage.id, messageId))
      .returning();

    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error("[Torch Update Message Artifact Error]:", error);
    return NextResponse.json(
      { error: "Failed to update artifact status." },
      { status: 500 }
    );
  }
}
