import { db } from "@/utils/db";
import { projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";

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

    const access = await getProjectAccess(projectId, session.user.id);
    if (!access.proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!access.isAuthorized || !canManageProject(access.role)) {
      return NextResponse.json({ error: "Only the project owner or agency can remove members." }, { status: 403 });
    }

    if (access.proj.createdBy === targetUserId) {
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
