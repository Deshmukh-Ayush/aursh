"use server"

import { db } from "@/utils/db";
import { project, projectMember, projectInvitation } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sendProjectInvitationEmail } from "@/lib/email";

export async function createProjectAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const clientEmail = formData.get("clientEmail") as string;

    if (!name || !clientEmail) {
      return { error: "Name and Client Email are required." };
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user || !session.session.activeOrganizationId) {
      return { error: "Unauthorized or no active organization." };
    }

    const userId = session.user.id;
    const orgId = session.session.activeOrganizationId;

    // Generate token
    const token = crypto.randomUUID();

    // Perform batch instead of transaction for Neon HTTP driver
    const projectId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await db.batch([
      // 1. Create Project
      db.insert(project).values({
        id: projectId,
        name,
        organizationId: orgId,
        createdBy: userId,
        status: "active",
      }),
      // 2. Add Project Owner
      db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId,
        userId,
        role: "owner",
      }),
      // 3. Create Project Invitation
      db.insert(projectInvitation).values({
        id: crypto.randomUUID(),
        projectId,
        email: clientEmail,
        token,
        invitedBy: userId,
        status: "pending",
        expiresAt,
      })
    ]);

    // Auto-detect Vercel deployment URLs or fallback to localhost
    const baseUrl = process.env.BASE_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const inviteLink = `${baseUrl}/invite/${token}`;
    await sendProjectInvitationEmail(clientEmail, name, inviteLink);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create project error:", error);
    return { error: "Failed to create project." };
  }
}

export async function resendInviteAction(projectId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return { error: "Project not found" };

    const [invitation] = await db.select().from(projectInvitation).where(eq(projectInvitation.projectId, projectId));
    if (!invitation) return { error: "Invitation not found" };
    if (invitation.status === "accepted") return { error: "Invitation already accepted" };

    const baseUrl = process.env.BASE_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const inviteLink = `${baseUrl}/invite/${invitation.token}`;
    await sendProjectInvitationEmail(invitation.email, proj.name, inviteLink);

    return { success: true };
  } catch (error) {
    console.error("Resend invite error:", error);
    return { error: "Failed to resend invite." };
  }
}
