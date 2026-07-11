import { db } from "@/utils/db";
import { member } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
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
      return NextResponse.json({ error: "Only organization owners can remove members." }, { status: 403 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
    }

    const [targetMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, targetUserId)));

    if (targetMember?.role === "owner") {
      return NextResponse.json({ error: "Cannot remove an organization owner." }, { status: 400 });
    }

    await db.delete(member).where(and(eq(member.organizationId, orgId), eq(member.userId, targetUserId)));

    revalidatePath("/dashboard/settings");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove org member error:", error);
    return NextResponse.json({ error: "Failed to remove member." }, { status: 500 });
  }
}
