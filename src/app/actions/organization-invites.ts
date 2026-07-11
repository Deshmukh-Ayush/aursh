"use server";

import { db } from "@/utils/db";
import { organization, member, invitation, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createOrgInviteAction(email: string) {
  try {
    if (!email.trim() || !email.includes('@')) return { error: "Valid email is required." };

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user || !session.session.activeOrganizationId) {
      return { error: "Unauthorized" };
    }

    const orgId = session.session.activeOrganizationId;
    
    // Check role
    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)));

    if (!orgMember || orgMember.role !== "owner") {
      return { error: "Only organization owners can invite teammates." };
    }

    const [org] = await db.select().from(organization).where(eq(organization.id, orgId));
    if (!org) return { error: "Organization not found" };

    // Feature Gate: Agency Tier Only
    if (org.plan !== "agency") {
      return { error: "Organization teammates are only available on the Agency plan. Please upgrade." };
    }

    // Feature Gate: Max 5 Teammates
    // Count active members and pending invites
    const existingMembers = await db.select({ id: member.id }).from(member).where(eq(member.organizationId, orgId));
    const pendingInvites = await db.select({ id: invitation.id }).from(invitation).where(and(eq(invitation.organizationId, orgId), eq(invitation.status, "pending")));
    
    // Subtract 1 because the owner doesn't count towards the "additional teammates" limit (or maybe they do? "max 5 for now"). 
    // Let's assume total organization size max is 6 (1 owner + 5 teammates)
    if (existingMembers.length + pendingInvites.length >= 6) {
      return { error: "Agency plan is limited to 5 teammates. You have reached the limit." };
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(eq(member.organizationId, orgId), eq(user.email, email.trim().toLowerCase())));
      
    if (existingMember) {
      return { error: "User is already a member of this organization." };
    }

    // Create Invitation
    // BetterAuth uses the ID as the token sometimes, or we can just use the ID in a custom /org-invite/[id] route
    const inviteId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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
    
    // Return the token (id) to generate a shareable link
    return { success: true, token: inviteId };
  } catch (error) {
    console.error("Create org invite error:", error);
    return { error: "Failed to create invitation." };
  }
}

export async function revokeOrgInviteAction(inviteId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user || !session.session.activeOrganizationId) {
      return { error: "Unauthorized" };
    }

    const orgId = session.session.activeOrganizationId;

    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)));

    if (!orgMember || orgMember.role !== "owner") {
      return { error: "Only organization owners can revoke invites." };
    }

    await db.delete(invitation).where(and(eq(invitation.id, inviteId), eq(invitation.organizationId, orgId)));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Revoke org invite error:", error);
    return { error: "Failed to revoke invitation." };
  }
}

export async function removeOrgMemberAction(targetUserId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user || !session.session.activeOrganizationId) {
      return { error: "Unauthorized" };
    }

    const orgId = session.session.activeOrganizationId;

    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)));

    if (!orgMember || orgMember.role !== "owner") {
      return { error: "Only organization owners can remove members." };
    }

    // Prevent removing yourself
    if (targetUserId === session.user.id) {
      return { error: "You cannot remove yourself." };
    }

    // Check if target is owner
    const [targetMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, targetUserId)));

    if (targetMember?.role === "owner") {
      return { error: "Cannot remove an organization owner." };
    }

    await db.delete(member).where(and(eq(member.organizationId, orgId), eq(member.userId, targetUserId)));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Remove org member error:", error);
    return { error: "Failed to remove member." };
  }
}
