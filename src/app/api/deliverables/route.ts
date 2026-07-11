import { db } from "@/utils/db";
import { deliverable, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId, data } = await req.json();

    if (!projectId || !data || !data.title) {
      return NextResponse.json({ error: "Project ID and title are required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    let role: "agency" | "client" | "owner" | null = null;
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (member) {
      role = member.role as "agency" | "client" | "owner";
    } else if (session.session?.activeOrganizationId === proj.organizationId) {
      role = "agency";
    }

    if (!role || (role !== 'agency' && role !== 'owner')) {
      return NextResponse.json({ error: "Only the agency can create deliverables." }, { status: 403 });
    }

    const deliverableId = crypto.randomUUID();

    await db.insert(deliverable).values({
      id: deliverableId,
      projectId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "pending",
      createdBy: userId,
    });

    await logActivity({
      projectId,
      userId,
      type: "deliverable_created",
      metadata: { deliverableId, title: data.title }
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/deliverables`);
    return NextResponse.json({ success: true, deliverableId });
  } catch (error) {
    console.error("Create deliverable error:", error);
    return NextResponse.json({ error: "Failed to create deliverable." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { deliverableId, status, comment } = await req.json();

    if (!deliverableId || !status) {
      return NextResponse.json({ error: "Deliverable ID and status are required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    const [deliv] = await db.select().from(deliverable).where(eq(deliverable.id, deliverableId));
    if (!deliv) return NextResponse.json({ error: "Deliverable not found." }, { status: 404 });

    const [proj] = await db.select().from(project).where(eq(project.id, deliv.projectId));
    if (proj?.status === 'completed') {
      return NextResponse.json({ error: "Cannot modify deliverables on a completed project." }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, deliv.projectId), eq(projectMember.userId, userId)));

    if (!member) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });

    if (member.role === 'owner' || member.role === 'agency') {
      // Owners/agencies can freely move cards
    } else if (member.role === 'client') {
      if (status !== 'approved' && status !== 'revision_requested') {
        return NextResponse.json({ error: "Clients can only approve or request revisions." }, { status: 403 });
      }
      if (deliv.status !== 'in_review') {
        return NextResponse.json({ error: "Deliverable must be in review before action." }, { status: 400 });
      }
    }

    await db.update(deliverable).set({ status, updatedAt: new Date() }).where(eq(deliverable.id, deliverableId));

    let activityType: any = "deliverable_in_review";
    if (status === 'approved') activityType = "deliverable_approved";
    if (status === 'revision_requested') activityType = "revision_requested";

    await logActivity({
      projectId: deliv.projectId,
      userId,
      type: activityType,
      metadata: { deliverableId, title: deliv.title, comment: comment || null }
    });

    const otherMembers = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, deliv.projectId)));

    for (const m of otherMembers) {
      if (m.userId === userId) continue;
      
      let msg = "";
      if (status === "in_review") msg = `Deliverable "${deliv.title}" was submitted for review.`;
      if (status === "approved") msg = `Deliverable "${deliv.title}" was approved!`;
      if (status === "revision_requested") msg = `Revision requested for "${deliv.title}". ${comment ? `Comment: ${comment}` : ''}`;
      
      await createNotification(m.userId, deliv.projectId, activityType, msg);
    }
    
    revalidatePath(`/projects/${deliv.projectId}`);
    revalidatePath(`/projects/${deliv.projectId}/deliverables`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update deliverable error:", error);
    return NextResponse.json({ error: "Failed to update deliverable status." }, { status: 500 });
  }
}
