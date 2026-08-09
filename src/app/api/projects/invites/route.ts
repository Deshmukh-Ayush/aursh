import { db } from "@/utils/db";
import { projectInvitation } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendProjectInvitationEmail } from "@/lib/email";
import { inviteRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";
import { z } from "zod";

const inviteSchema = z.object({ projectId: z.string().min(1), email: z.string().trim().email().max(320) });

export async function POST(req: NextRequest) {
  try {
    const input = inviteSchema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const { projectId, email } = input.data;
    const reqHeaders = await headers();
    
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const access = await getProjectAccess(projectId, session.user.id);
    if (!access.proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!access.isAuthorized || !canManageProject(access.role)) {
      return NextResponse.json({ error: "Only the project owner or agency can create invites." }, { status: 403 });
    }
    const rateLimitResult = await checkRateLimit(inviteRateLimiter, `invite_${session.user.id}`);
    if (!rateLimitResult.success) return NextResponse.json({ error: "Too many invites sent. Please try again later." }, { status: 429 });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const normalizedEmail = email.toLowerCase();
    const [activeInvite] = await db.select({ id: projectInvitation.id }).from(projectInvitation).where(and(
      eq(projectInvitation.projectId, projectId),
      eq(projectInvitation.email, normalizedEmail),
      eq(projectInvitation.status, "pending"),
    ));
    if (activeInvite) return NextResponse.json({ error: "An active invitation already exists for this email." }, { status: 409 });

    await db.insert(projectInvitation).values({
      id: crypto.randomUUID(),
      projectId,
      email: normalizedEmail,
      token,
      invitedBy: session.user.id,
      expiresAt,
      status: "pending",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${token}`;
    
    // Fetch org details for branding if needed (optional, just passing nulls for now to ensure delivery)
    await sendProjectInvitationEmail(normalizedEmail, access.proj.name, inviteLink);

    revalidatePath(`/projects/${projectId}/settings`);
    
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json({ error: "Failed to create invitation." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [invite] = await db.select().from(projectInvitation).where(eq(projectInvitation.id, inviteId));
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

    const access = await getProjectAccess(invite.projectId, session.user.id);
    if (!access.isAuthorized || !canManageProject(access.role)) {
      return NextResponse.json({ error: "Only the project owner or agency can revoke invites." }, { status: 403 });
    }

    await db.delete(projectInvitation).where(eq(projectInvitation.id, inviteId));

    revalidatePath(`/projects/${invite.projectId}/settings`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke invite error:", error);
    return NextResponse.json({ error: "Failed to revoke invitation." }, { status: 500 });
  }
}
