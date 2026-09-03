import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { paymentMilestone, payment, deliverable, invoice, paymentProof } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { PaymentsViewClient, MilestoneWithDetails } from "@/components/projects/payments";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";
import { InvoiceData } from "@/lib/invoices/types";
import { PaymentProofItem } from "@/components/projects/payments/payment-proof-review-modal";

export const metadata: Metadata = {
  title: "Payments & Invoices",
  description: "Track project financials, payment milestones, and client invoices.",
};

async function PaymentsData({ projectId }: { projectId: string }) {
  const session = await getCachedSession();
  const { role } = await getProjectAccess(projectId, session.user.id);

  const [milestonesData, paymentsData, deliverablesData, invoicesData, paymentProofsData] = await Promise.all([
    db.select().from(paymentMilestone).where(eq(paymentMilestone.projectId, projectId)).orderBy(asc(paymentMilestone.sortOrder), asc(paymentMilestone.createdAt)),
    db.select().from(payment).where(eq(payment.projectId, projectId)).orderBy(desc(payment.createdAt)),
    db.select().from(deliverable).where(eq(deliverable.projectId, projectId)).orderBy(asc(deliverable.createdAt)),
    db.query.invoice.findMany({
      where: eq(invoice.projectId, projectId),
      with: { lineItems: true },
      orderBy: [desc(invoice.createdAt)],
    }),
    db.query.paymentProof.findMany({
      where: eq(paymentProof.projectId, projectId),
      orderBy: [desc(paymentProof.createdAt)],
    }),
  ]);

  const deliverablesMap = new Map(deliverablesData.map((d) => [d.id, d.title]));

  const serializedMilestones: MilestoneWithDetails[] = milestonesData.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    proposalId: m.proposalId,
    deliverableId: m.deliverableId,
    deliverableTitle: m.deliverableId ? deliverablesMap.get(m.deliverableId) || null : null,
    title: m.title,
    description: m.description,
    amount: m.amount,
    currency: m.currency,
    triggerType: m.triggerType as any,
    dueDate: m.dueDate,
    status: m.status as any,
    createdAt: m.createdAt,
  }));

  const serializedPayments = paymentsData.map((p) => ({
    id: p.id,
    milestoneId: p.milestoneId,
    amount: p.amount,
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    status: p.status,
    paidAt: p.paidAt,
  }));

  const serializedInvoices: InvoiceData[] = invoicesData.map((inv) => ({
    id: inv.id,
    projectId: inv.projectId,
    organizationId: inv.organizationId,
    milestoneId: inv.milestoneId,
    invoiceNumber: inv.invoiceNumber,
    prefix: inv.prefix,
    serialNumber: inv.serialNumber,
    currency: inv.currency as "USD" | "INR",
    themeColor: inv.themeColor,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    paymentTerms: inv.paymentTerms,
    companySnapshot: inv.companySnapshot as any,
    clientSnapshot: inv.clientSnapshot as any,
    billingDetails: inv.billingDetails as any,
    lineItems: inv.lineItems.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      sortOrder: item.sortOrder,
    })),
    notes: inv.notes,
    additionalTerms: inv.additionalTerms,
    paymentInformation: inv.paymentInformation as any,
    subtotal: inv.subtotal,
    total: inv.total,
    status: inv.status as any,
    sentAt: inv.sentAt,
    viewedAt: inv.viewedAt,
    paidAt: inv.paidAt,
    pdfUrl: inv.pdfUrl,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  }));

  const deliverablesList = deliverablesData.map((d) => ({
    id: d.id,
    title: d.title,
  }));

  const serializedPaymentProofs: PaymentProofItem[] = paymentProofsData.map((proof) => {
    const matchedMilestone = milestonesData.find((m) => m.id === proof.milestoneId);
    return {
      id: proof.id,
      invoiceId: proof.invoiceId,
      milestoneId: proof.milestoneId,
      projectId: proof.projectId,
      fileUrl: proof.fileUrl,
      fileName: proof.fileName,
      fileType: proof.fileType,
      fileSize: proof.fileSize,
      extractedData: (proof.extractedData as any) || null,
      status: proof.status as any,
      rejectionReason: proof.rejectionReason,
      submittedBy: proof.submittedBy,
      createdAt: proof.createdAt.toISOString(),
      milestoneTitle: matchedMilestone?.title,
      milestoneAmount: matchedMilestone?.amount,
      currency: matchedMilestone?.currency,
    };
  });

  return (
    <PaymentsViewClient
      projectId={projectId}
      milestones={serializedMilestones}
      payments={serializedPayments}
      invoices={serializedInvoices}
      paymentProofs={serializedPaymentProofs}
      currentUserId={session.user.id}
      userRole={role!}
      deliverablesList={deliverablesList}
    />
  );
}

export default async function PaymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <PaymentsData projectId={projectId} />
    </Suspense>
  );
}
