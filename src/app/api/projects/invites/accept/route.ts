import { db } from "@/utils/db";
import { projectInvitation, projectMember, contract, signature } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  token: z.string().min(32, "A valid invitation token is required."),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = acceptInvitationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { token } = parsed.data;

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

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "This invitation is no longer active." }, { status: 400 });
    }

    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ error: "Email mismatch. This invitation was sent to a different email address." }, { status: 403 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invitation expired." }, { status: 400 });
    }

    const existingContracts = await db
      .select()
      .from(contract)
      .where(and(
        eq(contract.projectId, invitation.projectId),
        inArray(contract.status, ["draft", "sent", "partially_signed", "pending_signature"]),
      ));

    const [existingMember] = await db
      .select({ id: projectMember.id })
      .from(projectMember)
      .where(and(
        eq(projectMember.projectId, invitation.projectId),
        eq(projectMember.userId, userId),
      ));

    const existingSignatures = existingContracts.length === 0
      ? []
      : await db
        .select({ contractId: signature.contractId })
        .from(signature)
        .where(and(
          eq(signature.userId, userId),
          inArray(signature.contractId, existingContracts.map((item) => item.id)),
        ));
    const signedContractIds = new Set(existingSignatures.map((item) => item.contractId));
    const signatureRows = existingContracts
      .filter((item) => !signedContractIds.has(item.id))
      .map((item) => ({
        id: crypto.randomUUID(),
        contractId: item.id,
        userId,
      }));

    const operations = [
      db.update(projectInvitation)
        .set({ status: "accepted" })
        .where(and(eq(projectInvitation.id, invitation.id), eq(projectInvitation.status, "pending"))),
      ...(existingMember ? [] : [db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId: invitation.projectId,
        userId,
        role: invitation.role === "agency" ? "agency" : "client",
      })]),
      ...(signatureRows.length > 0 ? [db.insert(signature).values(signatureRows)] : []),
    ];

    if (operations.length > 0) {
      await db.batch([operations[0], ...operations.slice(1)]);
    }

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
