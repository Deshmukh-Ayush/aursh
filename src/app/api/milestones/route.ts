import { db } from "@/utils/db";
import { paymentMilestone, payment, projectMember, project } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const milestones = await db
      .select()
      .from(paymentMilestone)
      .where(eq(paymentMilestone.projectId, projectId))
      .orderBy(asc(paymentMilestone.sortOrder), asc(paymentMilestone.createdAt));

    const paymentsList = await db
      .select()
      .from(payment)
      .where(eq(payment.projectId, projectId));

    return NextResponse.json({ milestones, payments: paymentsList });
  } catch (error) {
    console.error("GET milestones error:", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, title, description, amount, currency = "INR", triggerType = "manual", dueDate, deliverableId } = body;

    if (!projectId || !title || !amount) {
      return NextResponse.json({ error: "Project ID, Title, and Amount are required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check membership
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));

    const isAgency = member?.role === "owner" || member?.role === "agency" || (proj && session.session?.activeOrganizationId === proj.organizationId);
    if (!isAgency) {
      return NextResponse.json({ error: "Only agency members can create payment milestones" }, { status: 403 });
    }

    const newMilestoneId = crypto.randomUUID();
    const parsedAmount = Math.round(Number(amount)); // amount in paise / currency units

    await db.insert(paymentMilestone).values({
      id: newMilestoneId,
      projectId,
      title,
      description: description || null,
      amount: parsedAmount,
      currency: currency.toUpperCase(),
      triggerType: triggerType as any,
      dueDate: dueDate ? new Date(dueDate) : null,
      deliverableId: deliverableId || null,
      status: triggerType === "upfront" ? "due" : "upcoming",
      createdBy: userId,
    });

    await logActivity({
      projectId,
      userId,
      type: "milestone_created",
      metadata: { milestoneTitle: title, amount: parsedAmount, currency }
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/payments`);

    return NextResponse.json({ success: true, milestoneId: newMilestoneId });
  } catch (error) {
    console.error("POST milestone error:", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { milestoneId, status, title, description, amount, dueDate } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID required" }, { status: 400 });
    }

    const [existing] = await db.select().from(paymentMilestone).where(eq(paymentMilestone.id, milestoneId));
    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (amount) updates.amount = Math.round(Number(amount));
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    await db.update(paymentMilestone).set(updates).where(eq(paymentMilestone.id, milestoneId));

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/payments`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH milestone error:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const milestoneId = searchParams.get("milestoneId");

    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID required" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existing] = await db.select().from(paymentMilestone).where(eq(paymentMilestone.id, milestoneId));
    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    await db.delete(paymentMilestone).where(eq(paymentMilestone.id, milestoneId));

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/payments`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE milestone error:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
