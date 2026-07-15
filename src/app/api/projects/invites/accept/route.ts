import { db } from "@/utils/db";
import { projectInvitation, projectMember, contract, signature } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const userId = session.user.id;

    const [invitation] = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.token, token));

    if (!invitation) {
      return NextResponse.json({ error: "Invalid token." }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({ error: "Already accepted." }, { status: 400 });
    }

    if (session.user.email !== invitation.email) {
      return NextResponse.json({ error: "Email mismatch. This invitation was sent to a different email address." }, { status: 403 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invitation expired." }, { status: 400 });
    }

    const [existingContract] = await db
      .select()
      .from(contract)
      .where(eq(contract.projectId, invitation.projectId));

    const operations: any[] = [
      db
        .update(projectInvitation)
        .set({ status: "accepted" })
        .where(eq(projectInvitation.id, invitation.id)),

      db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId: invitation.projectId,
        userId: userId,
        role: "client",
      })
    ];

    if (existingContract) {
      operations.push(
        db.insert(signature).values({
          id: crypto.randomUUID(),
          contractId: existingContract.id,
          userId: userId,
        })
      );

      if (existingContract.status === "signed") {
        operations.push(
          db.update(contract)
            .set({ status: "pending_signature" })
            .where(eq(contract.id, existingContract.id))
        );
      }
    }

    await db.batch(operations as any);

    await logActivity({
      projectId: invitation.projectId,
      userId: userId,
      type: "member_joined",
      metadata: { email: session.user.email }
    });


    revalidatePath("/dashboard");
    return NextResponse.json({ success: true, projectId: invitation.projectId });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Failed to accept invitation." }, { status: 500 });
  }
}
