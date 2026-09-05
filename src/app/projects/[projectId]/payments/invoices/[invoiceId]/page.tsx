import type { Metadata } from "next";
import { getCachedSession } from "@/utils/cached-session";
import { getProjectAccess, canManageProject } from "@/lib/project-auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/utils/db";
import { invoice, invoiceLineItem, paymentMilestone, paymentProof } from "@/db/schema";
import { eq } from "drizzle-orm";
import { InvoiceViewClient } from "./invoice-view-client";
import { InvoiceData } from "@/lib/invoices/types";

export const metadata: Metadata = {
  title: "View Invoice",
  description: "View project invoice document and payment status.",
};

interface PageProps {
  params: Promise<{ projectId: string; invoiceId: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { projectId, invoiceId } = await params;

  const session = await getCachedSession();
  if (!session || !session.user) {
    redirect("/sign-in");
  }

  // Authorization: must have access to the project
  const access = await getProjectAccess(projectId, session.user.id);
  if (!access.isAuthorized) {
    redirect(`/projects/${projectId}`);
  }

  const isAgency = canManageProject(access.role);

  const invoiceRow = await db.query.invoice.findFirst({
    where: eq(invoice.id, invoiceId),
    with: {
      lineItems: true,
      milestone: true,
    },
  });

  if (!invoiceRow || invoiceRow.projectId !== projectId) {
    notFound();
  }

  const serializedInvoice: InvoiceData = {
    id: invoiceRow.id,
    projectId: invoiceRow.projectId,
    organizationId: invoiceRow.organizationId,
    milestoneId: invoiceRow.milestoneId,
    milestoneTitle: invoiceRow.milestone?.title || null,
    invoiceNumber: invoiceRow.invoiceNumber,
    prefix: invoiceRow.prefix,
    serialNumber: invoiceRow.serialNumber,
    currency: invoiceRow.currency as "USD" | "INR",
    themeColor: invoiceRow.themeColor,
    fontFamily: "sans",
    invoiceDate: invoiceRow.invoiceDate ? invoiceRow.invoiceDate.toISOString() : new Date().toISOString(),
    dueDate: invoiceRow.dueDate ? invoiceRow.dueDate.toISOString() : new Date().toISOString(),
    paymentTerms: invoiceRow.paymentTerms,
    companySnapshot: (invoiceRow.companySnapshot as any) || {},
    clientSnapshot: (invoiceRow.clientSnapshot as any) || {},
    billingDetails: (invoiceRow.billingDetails as any) || [],
    notes: invoiceRow.notes,
    additionalTerms: invoiceRow.additionalTerms,
    paymentInformation: (invoiceRow.paymentInformation as any) || [],
    subtotal: invoiceRow.subtotal,
    total: invoiceRow.total,
    status: invoiceRow.status as any,
    sentAt: invoiceRow.sentAt ? invoiceRow.sentAt.toISOString() : null,
    viewedAt: invoiceRow.viewedAt ? invoiceRow.viewedAt.toISOString() : null,
    paidAt: invoiceRow.paidAt ? invoiceRow.paidAt.toISOString() : null,
    pdfUrl: invoiceRow.pdfUrl,
    createdAt: invoiceRow.createdAt.toISOString(),
    lineItems: (invoiceRow.lineItems || []).map((li) => ({
      id: li.id,
      itemName: li.itemName,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      lineTotal: li.lineTotal,
      sortOrder: li.sortOrder,
    })),
  };

  const proofRow = await db.query.paymentProof.findFirst({
    where: eq(paymentProof.invoiceId, invoiceId),
    orderBy: (proof, { desc }) => [desc(proof.createdAt)],
  });

  const serializedProof = proofRow
    ? {
        id: proofRow.id,
        invoiceId: proofRow.invoiceId,
        milestoneId: proofRow.milestoneId,
        projectId: proofRow.projectId,
        fileUrl: proofRow.fileUrl,
        fileName: proofRow.fileName,
        fileType: proofRow.fileType,
        fileSize: proofRow.fileSize,
        extractedData: (proofRow.extractedData as any) || null,
        status: proofRow.status as any,
        rejectionReason: proofRow.rejectionReason,
        submittedBy: proofRow.submittedBy,
        createdAt: proofRow.createdAt.toISOString(),
        invoiceNumber: invoiceRow.invoiceNumber,
        invoiceTotal: invoiceRow.total,
        currency: invoiceRow.currency,
        milestoneTitle: invoiceRow.milestone?.title || `Invoice ${invoiceRow.invoiceNumber}`,
        milestoneAmount: invoiceRow.total,
      }
    : null;

  return (
    <InvoiceViewClient
      invoice={serializedInvoice}
      proof={serializedProof}
      projectId={projectId}
      isAgency={isAgency}
    />
  );
}
