"use server"

import { db } from "@/utils/db";
import { projectInvitation, projectMember, project, contract, signature } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { logActivity } from "@/lib/activity";

export async function acceptProjectInvitation(token: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    const [invitation] = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.token, token));

    if (!invitation) {
      return { error: "Invalid token." };
    }

    if (invitation.status === "accepted") {
      return { error: "Already accepted." };
    }

    if (session.user.email !== invitation.email) {
      return { error: "Email mismatch. This invitation was sent to a different email address." };
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return { error: "Invitation expired." };
    }

    const [existingContract] = await db
      .select()
      .from(contract)
      .where(eq(contract.projectId, invitation.projectId));

    const operations: any[] = [
      // 1. Mark invite as accepted
      db
        .update(projectInvitation)
        .set({ status: "accepted" })
        .where(eq(projectInvitation.id, invitation.id)),

      // 2. Add user as client member
      db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId: invitation.projectId,
        userId: userId,
        role: "client",
      })
    ];

    // 3. If a contract already exists, ensure this new member has a signature row
    if (existingContract) {
      operations.push(
        db.insert(signature).values({
          id: crypto.randomUUID(),
          contractId: existingContract.id,
          userId: userId,
        })
      );

      // If the contract was "signed" previously, it needs to be pending again
      if (existingContract.status === "signed") {
        operations.push(
          db.update(contract)
            .set({ status: "pending_signature" })
            .where(eq(contract.id, existingContract.id))
        );
      }
    }

    // Process acceptance
    await db.batch(operations as any);

    await logActivity({
      projectId: invitation.projectId,
      userId: userId,
      type: "member_joined",
      metadata: { email: session.user.email }
    });

    revalidatePath("/dashboard");
    return { success: true, projectId: invitation.projectId };
  } catch (error) {
    console.error("Accept invitation error:", error);
    return { error: "Failed to accept invitation." };
  }
}
