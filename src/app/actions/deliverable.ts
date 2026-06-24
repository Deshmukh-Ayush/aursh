"use server"

import { db } from "@/utils/db";
import { deliverable, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";

export async function createDeliverableAction(projectId: string, data: { title: string, description: string, dueDate: Date | null }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const userId = session.user.id;

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return { error: "Project not found" };

    // Verify ownership (Explicit or Implicit)
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
      return { error: "Only the agency can create deliverables." };
    }

    const deliverableId = crypto.randomUUID();

    await db.insert(deliverable).values({
      id: deliverableId,
      projectId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
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
    return { success: true };
  } catch (error) {
    console.error("Create deliverable error:", error);
    return { error: "Failed to create deliverable." };
  }
}

export async function updateDeliverableStatusAction(deliverableId: string, status: "pending" | "in_review" | "approved" | "revision_requested", comment?: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const userId = session.user.id;

    const [deliv] = await db.select().from(deliverable).where(eq(deliverable.id, deliverableId));
    if (!deliv) return { error: "Deliverable not found." };

    const [proj] = await db.select().from(project).where(eq(project.id, deliv.projectId));
    if (proj?.status === 'completed') {
      return { error: "Cannot modify deliverables on a completed project." };
    }

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, deliv.projectId), eq(projectMember.userId, userId)));

    if (!member) return { error: "Unauthorized." };

    // Enforce role-based state transitions
    if (member.role === 'owner') {
      if (status !== 'in_review') return { error: "Owners can only mark deliverables as in_review." };
    } else if (member.role === 'client') {
      if (status !== 'approved' && status !== 'revision_requested') {
        return { error: "Clients can only approve or request revisions." };
      }
      if (deliv.status !== 'in_review') {
        return { error: "Deliverable must be in review before action." };
      }
    }

    await db.update(deliverable).set({ status, updatedAt: new Date() }).where(eq(deliverable.id, deliverableId));

    // Log Activity
    let activityType: any = "deliverable_in_review";
    if (status === 'approved') activityType = "deliverable_approved";
    if (status === 'revision_requested') activityType = "revision_requested";

    await logActivity({
      projectId: deliv.projectId,
      userId,
      type: activityType,
      metadata: { deliverableId, title: deliv.title, comment: comment || null }
    });

    // We do NOT mark project completed here. That is a separate action on the overview page.
    
    revalidatePath(`/projects/${deliv.projectId}`);
    revalidatePath(`/projects/${deliv.projectId}/deliverables`);
    return { success: true };
  } catch (error) {
    console.error("Update deliverable error:", error);
    return { error: "Failed to update deliverable status." };
  }
}
