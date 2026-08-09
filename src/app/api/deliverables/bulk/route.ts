import { db } from "@/utils/db";
import { deliverable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "in_review", "approved", "revision_requested"]).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  submissionTitle: z.string().trim().max(200).nullable().optional(),
  submissionUrl: z.string().url().max(2_000).nullable().optional(),
  submissionNote: z.string().trim().max(10_000).nullable().optional(),
}).refine((update) => Object.keys(update).some((key) => key !== "id"), { message: "Each update must contain a change" });

const bulkSchema = z.object({
  updates: z.array(updateSchema).min(1).max(100),
}).refine(({ updates }) => new Set(updates.map((update) => update.id)).size === updates.length, { message: "Each deliverable can be updated only once" });

export async function PATCH(req: NextRequest) {
  try {
    const input = bulkSchema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deliverableIds = input.data.updates.map((update) => update.id);
    const existing = await db.select().from(deliverable).where(inArray(deliverable.id, deliverableIds));
    if (existing.length !== deliverableIds.length) return NextResponse.json({ error: "One or more deliverables were not found" }, { status: 404 });
    const projectId = existing[0]?.projectId;
    if (!projectId || existing.some((item) => item.projectId !== projectId)) {
      return NextResponse.json({ error: "Bulk updates must target one project" }, { status: 400 });
    }
    const access = await getProjectAccess(projectId, session.user.id);
    if (!access.isAuthorized || !canManageProject(access.role)) {
      return NextResponse.json({ error: "Only the agency can bulk update deliverables" }, { status: 403 });
    }

    await db.batch(input.data.updates.map(({ id, ...update }) =>
      db.update(deliverable).set({ ...update, updatedAt: new Date() }).where(eq(deliverable.id, id)),
    ));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH bulk deliverables error:", error);
    return NextResponse.json({ error: "Failed to update deliverables" }, { status: 500 });
  }
}
