"use server"

import { db } from "@/utils/db";
import { projectInvitation, projectMember, project, contract, signature } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

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

    const otherMembers = await db
      .select()
      .from(projectMember)
      .where(eq(projectMember.projectId, invitation.projectId));

    for (const m of otherMembers) {
      if (m.userId === userId) continue;
      await createNotification(
        m.userId,
        invitation.projectId,
        "member_joined",
        `${session.user.name || session.user.email} joined the project.`
      );
    }

    revalidatePath("/dashboard");
    return { success: true, projectId: invitation.projectId };
  } catch (error) {
    console.error("Accept invitation error:", error);
    return { error: "Failed to accept invitation." };
  }
}

export async function createProjectInviteAction(projectId: string, email: string) {
  try {
    if (!email.trim() || !email.includes('@')) return { error: "Valid email is required." };

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return { error: "Project not found" };

    let role: "agency" | "client" | "owner" | null = null;
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));

    if (member) {
      role = member.role as "agency" | "client" | "owner";
    } else if (session.session?.activeOrganizationId === proj.organizationId) {
      role = "agency";
    }

    if (!role || (role !== 'owner' && role !== 'agency')) {
      return { error: "Only the project owner or agency can create invites." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.insert(projectInvitation).values({
      id: crypto.randomUUID(),
      projectId,
      email: email.trim().toLowerCase(),
      token,
      invitedBy: session.user.id,
      expiresAt,
      status: "pending",
    });

    revalidatePath(`/projects/${projectId}/settings`);
    
    // In production we could send an email, but for V1 we return the token for a shareable link
    return { success: true, token };
  } catch (error) {
    console.error("Create invite error:", error);
    return { error: "Failed to create invitation." };
  }
}

export async function revokeInviteAction(inviteId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const [invite] = await db.select().from(projectInvitation).where(eq(projectInvitation.id, inviteId));
    if (!invite) return { error: "Invite not found" };

    const [proj] = await db.select().from(project).where(eq(project.id, invite.projectId));
    
    let role: "agency" | "client" | "owner" | null = null;
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, invite.projectId), eq(projectMember.userId, session.user.id)));

    if (member) {
      role = member.role as "agency" | "client" | "owner";
    } else if (session.session?.activeOrganizationId === proj?.organizationId) {
      role = "agency";
    }

    if (!role || (role !== 'owner' && role !== 'agency')) {
      return { error: "Only the project owner or agency can revoke invites." };
    }

    await db.delete(projectInvitation).where(eq(projectInvitation.id, inviteId));

    revalidatePath(`/projects/${invite.projectId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Revoke invite error:", error);
    return { error: "Failed to revoke invitation." };
  }
}
