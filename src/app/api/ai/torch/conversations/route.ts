import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import {
  torchConversation,
  torchMessage,
  deliverable,
  proposal,
  invoice,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import crypto from "crypto";
import { TorchArtifact } from "@/components/dashboard/ai/torch/torch-context";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the most recently active conversation for this user and organization
    const conv = await db.query.torchConversation.findFirst({
      where: and(
        eq(torchConversation.organizationId, organizationId),
        eq(torchConversation.userId, user.id)
      ),
      orderBy: [desc(torchConversation.updatedAt)],
    });

    if (!conv) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    // Load recent messages (up to 50) in chronological order
    const rawMessages = await db.query.torchMessage.findMany({
      where: eq(torchMessage.conversationId, conv.id),
      orderBy: [asc(torchMessage.createdAt)],
      limit: 50,
    });

    // Revalidate pending artifacts against live database records
    const formattedMessages = await Promise.all(
      rawMessages.map(async (msg) => {
        let artifact = msg.artifact as TorchArtifact | null;

        if (artifact && artifact.status === "pending") {
          let isNowApproved = false;

          if (artifact.type === "create_deliverable_confirmation") {
            const draftTitle = artifact.data.draft.title;
            const projectId = artifact.data.projectId;
            const existing = await db.query.deliverable.findFirst({
              where: and(
                eq(deliverable.projectId, projectId),
                eq(deliverable.title, draftTitle)
              ),
            });
            if (existing) isNowApproved = true;
          } else if (artifact.type === "change_order_addendum") {
            const addendumTitle = artifact.data.addendum.title;
            const projectId = artifact.data.projectId;
            const existing = await db.query.proposal.findFirst({
              where: and(
                eq(proposal.projectId, projectId),
                eq(proposal.title, addendumTitle)
              ),
            });
            if (existing) isNowApproved = true;
          } else if (artifact.type === "draft_invoice_confirmation") {
            const milestoneId = artifact.data.milestoneId;
            const projectId = artifact.data.projectId;
            if (milestoneId) {
              const existing = await db.query.invoice.findFirst({
                where: and(
                  eq(invoice.projectId, projectId),
                  eq(invoice.milestoneId, milestoneId)
                ),
              });
              if (existing) isNowApproved = true;
            }
          }

          if (isNowApproved) {
            artifact = {
              ...artifact,
              status: "approved",
            };
            // Sync the updated status to the database row
            await db
              .update(torchMessage)
              .set({ artifact })
              .where(eq(torchMessage.id, msg.id));
          }
        }

        const createdAtFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          toolCalls: (msg.reasoningSteps as any) || [],
          artifact: artifact || undefined,
          createdAt: createdAtFormatted,
        };
      })
    );

    return NextResponse.json({
      conversation: conv,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("[Torch Get Conversations Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const newId = crypto.randomUUID();

    const [newConv] = await db
      .insert(torchConversation)
      .values({
        id: newId,
        organizationId,
        userId: user.id,
        title: body.title || null,
      })
      .returning();

    return NextResponse.json({ conversation: newConv });
  } catch (error) {
    console.error("[Torch Create Conversation Error]:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
