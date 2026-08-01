import { db } from "@/utils/db";
import { projectInvitation, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendProjectInvitationEmail } from "@/lib/email";
import { inviteRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId, email } = await req.json();
    const reqHeaders = await headers();
    
    // Rate limit check: 5 requests per 10 minutes per IP
    const ip = reqHeaders.get("x-forwarded-for") || "unknown-ip";
    const rateLimitResult = await checkRateLimit(inviteRateLimiter, `invite_${ip}`);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many invites sent. Please try again later." }, { status: 429 });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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
      return NextResponse.json({ error: "Only the project owner or agency can create invites." }, { status: 403 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(projectInvitation).values({
      id: crypto.randomUUID(),
      projectId,
      email: email.trim().toLowerCase(),
      token,
      invitedBy: session.user.id,
      expiresAt,
      status: "pending",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${token}`;
    
    // Fetch org details for branding if needed (optional, just passing nulls for now to ensure delivery)
    await sendProjectInvitationEmail(email.trim().toLowerCase(), proj.name, inviteLink);

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
