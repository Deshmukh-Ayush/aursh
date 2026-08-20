import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import { deliverable, proposal, proposalLineItems, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { actionType, payload } = await req.json();

    if (actionType === "create_deliverable") {
      const { projectId, title, description, dueDate } = payload;

      const [proj] = await db
        .select()
        .from(project)
        .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)));

      if (!proj) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }

      const newId = crypto.randomUUID();
      await db.insert(deliverable).values({
        id: newId,
        projectId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "pending",
        createdBy: user.id,
      });

      revalidatePath(`/projects/${projectId}/deliverables`);
      revalidatePath("/dashboard/ai");

      return NextResponse.json({ success: true, deliverableId: newId });
    }

    if (actionType === "create_addendum_proposal") {
      const { projectId, addendum } = payload;

      const [proj] = await db
        .select()
        .from(project)
        .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)));

      if (!proj) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }

      const proposalId = crypto.randomUUID();
      await db.insert(proposal).values({
        id: proposalId,
        projectId,
        title: addendum.title,
        scopeSummary: addendum.summary,
        price: addendum.additionalPrice,
        currency: addendum.currency || "USD",
        status: "draft",
        createdBy: user.id,
      });

      if (addendum.lineItems && addendum.lineItems.length > 0) {
        const lineItemRows = addendum.lineItems.map(
          (item: { description: string; amount: number }, index: number) => ({
            id: crypto.randomUUID(),
            proposalId,
            description: item.description,
            quantity: 1,
            unitPrice: item.amount,
            total: item.amount,
            sortOrder: index,
          }),
        );
        await db.insert(proposalLineItems).values(lineItemRows);
      }

      revalidatePath(`/projects/${projectId}/proposal`);
      revalidatePath("/dashboard/ai");

      return NextResponse.json({ success: true, proposalId });
    }

    return NextResponse.json({ error: "Unsupported action type." }, { status: 400 });
  } catch (error) {
    console.error("[Torch Confirm Error]:", error);
    return NextResponse.json({ error: "Failed to apply mutation." }, { status: 500 });
  }
}
