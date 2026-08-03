import { db } from "@/utils/db";
import { deliverable, projectMember } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate permission based on the first deliverable's project
    const deliverableIds = updates.map(u => u.id);
    const existingDeliverables = await db.select().from(deliverable).where(inArray(deliverable.id, deliverableIds));
    
    if (existingDeliverables.length === 0) {
      return NextResponse.json({ error: "Deliverables not found" }, { status: 404 });
    }

    const projectId = existingDeliverables[0].projectId;

    // Optional: could check all deliverables belong to the same project
    const allSameProject = existingDeliverables.every(d => d.projectId === projectId);
    if (!allSameProject) {
        return NextResponse.json({ error: "Cannot bulk update deliverables across multiple projects" }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));
      
    // Clients might also bulk update statuses in kanban, so we just check they are a member. 
    // Further granular checks per-status can be added if needed.
    if (!member && !session.session?.activeOrganizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // We must execute sequentially or in a transaction. Drizzle ORM batch or sequential await.
    // For simplicity, we can do Promise.all
    await Promise.all(
        updates.map(update => {
            const updatePayload: any = {};
            if (update.status) updatePayload.status = update.status;
            if (update.dueDate !== undefined) updatePayload.dueDate = update.dueDate ? new Date(update.dueDate) : null;
            if (update.title) updatePayload.title = update.title;
            if (update.description !== undefined) updatePayload.description = update.description;
            if (update.submissionTitle !== undefined) updatePayload.submissionTitle = update.submissionTitle;
            if (update.submissionUrl !== undefined) updatePayload.submissionUrl = update.submissionUrl;
            if (update.submissionNote !== undefined) updatePayload.submissionNote = update.submissionNote;
            
            return db.update(deliverable)
                .set(updatePayload)
                .where(eq(deliverable.id, update.id));
        })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH bulk deliverables error:", error);
    return NextResponse.json({ error: "Failed to update deliverables" }, { status: 500 });
  }
}
