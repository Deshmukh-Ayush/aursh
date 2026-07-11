import { db } from "@/utils/db";
import { organization, member, invitation, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.session.activeOrganizationId;
    
    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)));

    if (!orgMember || orgMember.role !== "owner") {
      return NextResponse.json({ error: "Only organization owners can invite teammates." }, { status: 403 });
    }

    const [org] = await db.select().from(organization).where(eq(organization.id, orgId));
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Feature Gate: Agency Tier Only
    if (org.plan !== "agency") {
      return NextResponse.json({ error: "Organization teammates are only available on the Agency plan. Please upgrade." }, { status: 403 });
    }

    const existingMembers = await db.select({ id: member.id }).from(member).where(eq(member.organizationId, orgId));
    const pendingInvites = await db.select({ id: invitation.id }).from(invitation).where(and(eq(invitation.organizationId, orgId), eq(invitation.status, "pending")));
    
    if (existingMembers.length + pendingInvites.length >= 6) {
      return NextResponse.json({ error: "Agency plan is limited to 5 teammates. You have reached the limit." }, { status: 403 });
    }

    const [existingMember] = await db
      .select()
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(eq(member.organizationId, orgId), eq(user.email, email.trim().toLowerCase())));
      
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this organization." }, { status: 400 });
    }

    const inviteId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitation).values({
      id: inviteId,
      email: email.trim().toLowerCase(),
      inviterId: session.user.id,
      organizationId: orgId,
      role: "member",
      status: "pending",
      expiresAt,
    });

    revalidatePath("/dashboard/settings");
    
    return NextResponse.json({ success: true, token: inviteId });
  } catch (error) {
    console.error("Create org invite error:", error);
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
    if (!session || !session.user || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.session.activeOrganizationId;

    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)));

    if (!orgMember || orgMember.role !== "owner") {
      return NextResponse.json({ error: "Only organization owners can revoke invites." }, { status: 403 });
    }

    await db.delete(invitation).where(and(eq(invitation.id, inviteId), eq(invitation.organizationId, orgId)));

    revalidatePath("/dashboard/settings");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke org invite error:", error);
    return NextResponse.json({ error: "Failed to revoke invitation." }, { status: 500 });
  }
}
