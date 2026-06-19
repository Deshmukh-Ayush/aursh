"use server"

import { db } from "@/utils/db";
import { projectInvitation, projectMember, project } from "@/db/schema";
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

    // Process acceptance
    await db.batch([
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
    ]);

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
