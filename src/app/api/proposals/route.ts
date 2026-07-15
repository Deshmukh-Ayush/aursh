import { db } from "@/utils/db";
import { proposal, proposalLineItems, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposals = await db.query.proposal.findMany({
      where: eq(proposal.projectId, projectId),
      with: { lineItems: { orderBy: (lineItems, { asc }) => [asc(lineItems.sortOrder)] } },
      orderBy: (proposal, { desc }) => [desc(proposal.createdAt)],
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("GET proposal error:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, title, scopeSummary, price, currency, validUntil, lineItems } = await req.json();

    if (!projectId || !title || !price || !lineItems) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));
      
    // Needs to be owner to create proposal
    if (!member || member.role !== 'owner') {
      const [proj] = await db.select().from(project).where(eq(project.id, projectId));
      if (!proj || session.session?.activeOrganizationId !== proj.organizationId) {
         return NextResponse.json({ error: "Only project owners can create proposals" }, { status: 403 });
      }
    }

    const newProposalId = crypto.randomUUID();

    const lineItemsData = lineItems.map((item: any, index: number) => ({
      id: crypto.randomUUID(),
      proposalId: newProposalId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      sortOrder: index,
    }));

    await db.batch([
      db.insert(proposal).values({
        id: newProposalId,
        projectId,
        title,
        scopeSummary,
        price,
        currency,
        validUntil: new Date(validUntil),
        createdBy: session.user.id,
        status: "draft",
      }),
      db.insert(proposalLineItems).values(lineItemsData)
    ]);

    return NextResponse.json({ success: true, proposalId: newProposalId });
  } catch (error) {
    console.error("POST proposal error:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { proposalId, action, title, scopeSummary, price, currency, validUntil, lineItems } = await req.json();

    if (!proposalId || !action) {
      return NextResponse.json({ error: "Proposal ID and action are required" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [existing] = await db.select().from(proposal).where(eq(proposal.id, proposalId));
    if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, existing.projectId), eq(projectMember.userId, session.user.id)));
      
    const isOwner = member?.role === 'owner' || session.session?.activeOrganizationId;

    if (action === "update_draft") {
      if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (existing.status !== "draft") return NextResponse.json({ error: "Only draft proposals can be updated" }, { status: 400 });

      await db.update(proposal).set({
        title,
        scopeSummary,
        price,
        currency,
        validUntil: new Date(validUntil),
      }).where(eq(proposal.id, proposalId));

      await db.delete(proposalLineItems).where(eq(proposalLineItems.proposalId, proposalId));
      
      if (lineItems && lineItems.length > 0) {
        const lineItemsData = lineItems.map((item: any, index: number) => ({
          id: crypto.randomUUID(),
          proposalId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          sortOrder: index,
        }));
        await db.insert(proposalLineItems).values(lineItemsData);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "send") {
      if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (existing.status !== "draft") return NextResponse.json({ error: "Only draft proposals can be sent" }, { status: 400 });

      await db.update(proposal).set({ status: "sent", sentAt: new Date() }).where(eq(proposal.id, proposalId));
      
      await logActivity({
        projectId: existing.projectId,
        userId: session.user.id,
        type: "proposal_sent" as any,
        metadata: { proposalId: existing.id, title: existing.title }
      });


      return NextResponse.json({ success: true });
    }

    if (action === "accept") {
      if (existing.status !== "sent") return NextResponse.json({ error: "Proposal must be sent first" }, { status: 400 });

      await db.update(proposal).set({ status: "accepted", acceptedAt: new Date() }).where(eq(proposal.id, proposalId));
      
      // Auto-create deliverables from line items
      const { deliverable } = await import("@/db/schema");
      const lineItems = await db.query.proposalLineItems.findMany({
        where: eq(proposalLineItems.proposalId, proposalId)
      });
      
      if (lineItems.length > 0) {
        const deliverablesData = lineItems.map(item => ({
          id: crypto.randomUUID(),
          projectId: existing.projectId,
          title: item.description,
          description: `Auto-generated from proposal "${existing.title}"`,
          status: "pending" as any,
          createdBy: session.user.id,
          dueDate: null, // User will set this in the timeline
        }));
        await db.insert(deliverable).values(deliverablesData);
      }
      
      await logActivity({
        projectId: existing.projectId,
        userId: session.user.id,
        type: "proposal_accepted" as any,
        metadata: { proposalId: existing.id, title: existing.title }
      });


      return NextResponse.json({ success: true });
    }

    if (action === "decline") {
      if (existing.status !== "sent") return NextResponse.json({ error: "Proposal must be sent first" }, { status: 400 });

      await db.update(proposal).set({ status: "declined", declinedAt: new Date() }).where(eq(proposal.id, proposalId));
      
      await logActivity({
        projectId: existing.projectId,
        userId: session.user.id,
        type: "proposal_declined" as any,
        metadata: { proposalId: existing.id, title: existing.title }
      });


      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH proposal error:", error);
    return NextResponse.json({ error: "Failed to process proposal action" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const proposalId = searchParams.get("proposalId");

    if (!proposalId) {
      return NextResponse.json({ error: "Proposal ID is required" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [existing] = await db.select().from(proposal).where(eq(proposal.id, proposalId));
    if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, existing.projectId), eq(projectMember.userId, session.user.id)));
      
    const isOwner = member?.role === 'owner' || session.session?.activeOrganizationId;
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: "Cannot delete a proposal that is not a draft" }, { status: 400 });
    }

    await db.delete(proposal).where(eq(proposal.id, proposalId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE proposal error:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
