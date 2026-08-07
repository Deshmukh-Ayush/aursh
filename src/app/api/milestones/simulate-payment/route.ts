import { db } from "@/utils/db";
import { paymentMilestone, payment, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { milestoneId, paymentMethod = "dodo_test" } = await req.json();

    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID required" }, { status: 400 });
    }

    const [milestone] = await db.select().from(paymentMilestone).where(eq(paymentMilestone.id, milestoneId));
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.status === "paid") {
      return NextResponse.json({ error: "Milestone is already paid" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check project membership
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, milestone.projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }

    const newPaymentId = crypto.randomUUID();
    const now = new Date();

    // 1. Insert payment record (neon-http driver executes sequentially)
    await db.insert(payment).values({
      id: newPaymentId,
      milestoneId,
      projectId: milestone.projectId,
      amount: milestone.amount,
      currency: milestone.currency,
      dodoPaymentId: `test_pay_${Date.now()}`,
      dodoCheckoutId: `test_chk_${Date.now()}`,
      paymentMethod,
      status: "succeeded",
      paidAt: now,
    });

    // 2. Update milestone status to paid
    await db
      .update(paymentMilestone)
      .set({ status: "paid", updatedAt: now })
      .where(eq(paymentMilestone.id, milestoneId));

    // 3. Log activity
    await logActivity({
      projectId: milestone.projectId,
      userId,
      type: "payment_completed",
      metadata: {
        milestoneTitle: milestone.title,
        amount: milestone.amount,
        currency: milestone.currency,
        simulated: true,
      },
    });

    revalidatePath(`/projects/${milestone.projectId}`);
    revalidatePath(`/projects/${milestone.projectId}/payments`);

    return NextResponse.json({ success: true, paymentId: newPaymentId });
  } catch (error) {
    console.error("Simulate payment error:", error);
    return NextResponse.json({ error: "Failed to simulate payment" }, { status: 500 });
  }
}
