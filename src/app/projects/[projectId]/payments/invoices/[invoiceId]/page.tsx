import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { getProjectAccess, canManageProject } from "@/lib/project-auth";
import { db } from "@/utils/db";
import { invoice, paymentProof } from "@/db/schema";
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

async function InvoiceDetailData({
  projectId,
  invoiceId,
}: {
  projectId: string;
  invoiceId: string;
}) {
  const access = await getProjectAccess(projectId);
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

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { projectId, invoiceId } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <InvoiceDetailData projectId={projectId} invoiceId={invoiceId} />
      </Suspense>
    </div>
  );
}
