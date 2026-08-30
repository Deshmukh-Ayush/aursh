import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import {
  deliverable,
  proposal,
  proposalLineItems,
  invoice,
  invoiceLineItem,
  invoiceDefaults,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createDeliverableSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

const createAddendumProposalSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  addendum: z.object({
    title: z.string().min(1, "Addendum title is required"),
    summary: z.string().min(1, "Addendum summary is required"),
    additionalPrice: z.number().nonnegative("Additional price must be non-negative"),
    currency: z.enum(["USD", "INR"]).default("USD"),
    lineItems: z
      .array(
        z.object({
          description: z.string().min(1),
          amount: z.number().nonnegative(),
        })
      )
      .optional(),
  }),
});

const createInvoiceDraftSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  draftInvoice: z.object({
    prefix: z.string().max(20).optional(),
    serialNumber: z.number().int().positive().optional(),
    currency: z.enum(["USD", "INR"]).default("USD"),
    total: z.number().nonnegative(),
    subtotal: z.number().nonnegative().optional(),
    themeColor: z.string().max(50).optional(),
    invoiceDate: z.string().optional(),
    dueDate: z.string().optional(),
    paymentTerms: z.string().nullable().optional(),
    milestoneId: z.string().nullable().optional(),
    companySnapshot: z.record(z.string(), z.any()).optional(),
    clientSnapshot: z.record(z.string(), z.any()).optional(),
    billingDetails: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum(["fixed", "percentage"]),
          value: z.number(),
        })
      )
      .optional(),
    notes: z.string().nullable().optional(),
    additionalTerms: z.string().nullable().optional(),
    paymentInformation: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    lineItems: z
      .array(
        z.object({
          itemName: z.string().optional(),
          description: z.string().nullable().optional(),
          quantity: z.number().positive().optional(),
          unitPrice: z.number().nonnegative().optional(),
          lineTotal: z.number().nonnegative().optional(),
        })
      )
      .optional(),
  }),
});

const confirmRequestSchema = z.discriminatedUnion("actionType", [
  z.object({
    actionType: z.literal("create_deliverable"),
    payload: createDeliverableSchema,
  }),
  z.object({
    actionType: z.literal("create_addendum_proposal"),
    payload: createAddendumProposalSchema,
  }),
  z.object({
    actionType: z.literal("create_invoice_draft"),
    payload: createInvoiceDraftSchema,
  }),
]);

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json();
    const parsed = confirmRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload schema.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { actionType, payload } = parsed.data;
    const targetProjectId = payload.projectId;

    // Authorization: Verify project belongs to org and user has manage permission
    const access = await getProjectAccess(targetProjectId, user.id);
    if (!access.isAuthorized || !access.proj || access.proj.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Project not found in current organization." },
        { status: 404 }
      );
    }

    if (!canManageProject(access.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only agency owners and managers can approve workspace actions." },
        { status: 403 }
      );
    }

    if (actionType === "create_deliverable") {
      const { projectId, title, description, dueDate } = payload;

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
          (item, index) => ({
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

      const defaults = await db.query.invoiceDefaults.findFirst({
        where: eq(invoiceDefaults.organizationId, organizationId),
      });

      const prefix = (draftInvoice.prefix || defaults?.defaultPrefix || "INV-").trim();
      const serialNumber = draftInvoice.serialNumber || defaults?.nextSerial || 1;
      const formattedSerial = String(serialNumber).padStart(3, "0");
      const invoiceNumber = `${prefix}${formattedSerial}`;

      const invoiceId = crypto.randomUUID();
      const totalAmount = draftInvoice.total;
      const currency = draftInvoice.currency === "USD" ? "USD" : "INR";

      // Insert invoice strictly with status: "draft" (never sent automatically)
      await db.insert(invoice).values({
        id: invoiceId,
        projectId,
        organizationId,
        milestoneId: draftInvoice.milestoneId || null,
        invoiceNumber,
        prefix,
        serialNumber,
        currency,
        themeColor: draftInvoice.themeColor || "#00AAF7",
        invoiceDate: draftInvoice.invoiceDate ? new Date(draftInvoice.invoiceDate) : new Date(),
        dueDate: draftInvoice.dueDate ? new Date(draftInvoice.dueDate) : new Date(Date.now() + 14 * 86400000),
        paymentTerms: draftInvoice.paymentTerms || null,
        companySnapshot: draftInvoice.companySnapshot || {},
        clientSnapshot: draftInvoice.clientSnapshot || {},
        billingDetails: draftInvoice.billingDetails || [],
        notes: draftInvoice.notes || null,
        additionalTerms: draftInvoice.additionalTerms || null,
        paymentInformation: draftInvoice.paymentInformation || [],
        subtotal: draftInvoice.subtotal ?? totalAmount,
        total: totalAmount,
        status: "draft",
        createdBy: user.id,
      });

      // Insert line items
      const rawLineItems = draftInvoice.lineItems || [];
      if (rawLineItems.length > 0) {
        const itemRows = rawLineItems.map((item, idx) => ({
          id: crypto.randomUUID(),
          invoiceId,
          itemName: item.itemName || "Payment Milestone",
          description: item.description || null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice ?? totalAmount,
          lineTotal: item.lineTotal ?? totalAmount,
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
