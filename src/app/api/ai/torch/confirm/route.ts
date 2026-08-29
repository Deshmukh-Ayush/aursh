import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import {
  deliverable,
  proposal,
  proposalLineItems,
  project,
  invoice,
  invoiceLineItem,
  invoiceDefaults,
} from "@/db/schema";
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

    if (actionType === "create_invoice_draft") {
      const { projectId, draftInvoice } = payload;

      const [proj] = await db
        .select()
        .from(project)
        .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)));

      if (!proj) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }

      const defaults = await db.query.invoiceDefaults.findFirst({
        where: eq(invoiceDefaults.organizationId, organizationId),
      });

      const prefix = (typeof draftInvoice.prefix === "string" ? draftInvoice.prefix : defaults?.defaultPrefix || "INV-").trim();
      const serialNumber = typeof draftInvoice.serialNumber === "number" ? draftInvoice.serialNumber : defaults?.nextSerial || 1;
      const formattedSerial = String(serialNumber).padStart(3, "0");
      const invoiceNumber = `${prefix}${formattedSerial}`;

      const invoiceId = crypto.randomUUID();
      const totalAmount = typeof draftInvoice.total === "number" ? draftInvoice.total : 0;
      const currency = draftInvoice.currency === "USD" ? "USD" : "INR";

      // Insert invoice strictly with status: "draft" (never sent automatically)
      await db.insert(invoice).values({
        id: invoiceId,
        projectId,
        organizationId,
        milestoneId: typeof draftInvoice.milestoneId === "string" ? draftInvoice.milestoneId : null,
        invoiceNumber,
        prefix,
        serialNumber,
        currency,
        themeColor: typeof draftInvoice.themeColor === "string" ? draftInvoice.themeColor : "#00AAF7",
        invoiceDate: draftInvoice.invoiceDate ? new Date(draftInvoice.invoiceDate) : new Date(),
        dueDate: draftInvoice.dueDate ? new Date(draftInvoice.dueDate) : new Date(Date.now() + 14 * 86400000),
        paymentTerms: typeof draftInvoice.paymentTerms === "string" ? draftInvoice.paymentTerms : null,
        companySnapshot: draftInvoice.companySnapshot || {},
        clientSnapshot: draftInvoice.clientSnapshot || {},
        billingDetails: Array.isArray(draftInvoice.billingDetails) ? draftInvoice.billingDetails : [],
        notes: typeof draftInvoice.notes === "string" ? draftInvoice.notes : null,
        additionalTerms: typeof draftInvoice.additionalTerms === "string" ? draftInvoice.additionalTerms : null,
        paymentInformation: Array.isArray(draftInvoice.paymentInformation) ? draftInvoice.paymentInformation : [],
        subtotal: totalAmount,
        total: totalAmount,
        status: "draft",
        createdBy: user.id,
      });

      // Insert line items
      const rawLineItems = Array.isArray(draftInvoice.lineItems) ? draftInvoice.lineItems : [];
      if (rawLineItems.length > 0) {
        const itemRows = rawLineItems.map((item: { itemName?: string; description?: string; quantity?: number; unitPrice?: number; lineTotal?: number }, idx: number) => ({
          id: crypto.randomUUID(),
          invoiceId,
          itemName: item.itemName || "Payment Milestone",
          description: item.description || null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || totalAmount,
          lineTotal: item.lineTotal || totalAmount,
          sortOrder: idx,
        }));
        await db.insert(invoiceLineItem).values(itemRows);
      }

      // Increment serial in org invoice defaults
      if (defaults) {
        await db
          .update(invoiceDefaults)
          .set({ nextSerial: serialNumber + 1 })
          .where(eq(invoiceDefaults.organizationId, organizationId));
      } else {
        await db.insert(invoiceDefaults).values({
          id: crypto.randomUUID(),
          organizationId,
          defaultPrefix: prefix,
          nextSerial: serialNumber + 1,
        });
      }

      revalidatePath(`/projects/${projectId}/payments`);
      revalidatePath("/dashboard/ai");

      return NextResponse.json({
        success: true,
        invoiceId,
        invoiceNumber,
        status: "draft",
      });
    }

    return NextResponse.json({ error: "Unsupported action type." }, { status: 400 });
  } catch (error) {
    console.error("[Torch Confirm Error]:", error);
    return NextResponse.json({ error: "Failed to apply mutation." }, { status: 500 });
  }
}
