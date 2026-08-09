import { db } from "@/utils/db";
import { paymentMilestone, payment } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import crypto from "crypto";
import { z } from "zod";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";

const paymentConfirmationSchema = z.object({
  milestoneId: z.string().min(1),
  paymentMethod: z.string().trim().min(1).max(50).default("upi"),
  referenceNote: z.string().trim().max(500).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = paymentConfirmationSchema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const { milestoneId, paymentMethod, referenceNote } = input.data;

    const [milestone] = await db.select().from(paymentMilestone).where(eq(paymentMilestone.id, milestoneId));
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.status === "paid") {
      return NextResponse.json({ error: "Milestone is already paid" }, { status: 400 });
    }

    const userId = session.user.id;

    const access = await getProjectAccess(milestone.projectId, userId);
    if (!access.isAuthorized || !canManageProject(access.role)) return NextResponse.json({ error: "Only the agency can record payments" }, { status: 403 });

    const newPaymentId = crypto.randomUUID();
    const now = new Date();

    const changed = await db.update(paymentMilestone)
      .set({ status: "paid", updatedAt: now })
      .where(and(eq(paymentMilestone.id, milestoneId), eq(paymentMilestone.status, milestone.status)))
      .returning({ id: paymentMilestone.id });
    if (changed.length === 0) return NextResponse.json({ error: "Payment state changed; refresh and try again" }, { status: 409 });

    await db.insert(payment).values({
      id: newPaymentId,
      milestoneId,
      projectId: milestone.projectId,
      amount: milestone.amount,
      currency: milestone.currency,
      paymentMethod,
      referenceNote: referenceNote || null,
      status: "succeeded",
      paidAt: now,
    });

    await logActivity({
      projectId: milestone.projectId,
      userId,
      type: "payment_completed",
      metadata: {
        milestoneTitle: milestone.title,
        amount: milestone.amount,
        currency: milestone.currency,
        paymentMethod,
        referenceNote: referenceNote || null,
      },
    });

    revalidatePath(`/projects/${milestone.projectId}`);
    revalidatePath(`/projects/${milestone.projectId}/payments`);

    return NextResponse.json({ success: true, paymentId: newPaymentId });
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.json({ error: "Failed to mark milestone as paid" }, { status: 500 });
  }
}
