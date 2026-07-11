import { db } from "@/utils/db";
import { projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const targetUserId = searchParams.get("targetUserId");

    if (!projectId || !targetUserId) {
      return NextResponse.json({ error: "Project ID and target user ID are required" }, { status: 400 });
    }

    const reqHeaders = await headers();
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
      return NextResponse.json({ error: "Only the project owner or agency can remove members." }, { status: 403 });
    }

    if (proj.createdBy === targetUserId) {
      return NextResponse.json({ error: "Cannot remove the project creator." }, { status: 400 });
    }

    await db.delete(projectMember).where(and(
      eq(projectMember.projectId, projectId),
      eq(projectMember.userId, targetUserId)
    ));

    revalidatePath(`/projects/${projectId}/settings`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member." }, { status: 500 });
  }
}
