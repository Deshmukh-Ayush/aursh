"use client";

import { useState } from "react";
import { Plus, FileText, Download, CheckCircle2, Send, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { PaymentsRadialChart } from "./payments-radial-chart";
import { MilestonesEmptyState } from "./milestones-empty-state";
import { MilestoneItem } from "./milestone-item";
import { PaymentConfirmModal } from "./payment-confirm-modal";
import { CreateMilestoneModal } from "./create-milestone-modal";
import { InvoiceBuilderModal } from "@/components/invoices/invoice-builder-modal";
import { InvoicePreviewModal } from "@/components/invoices/invoice-preview-modal";
import { useUIStore } from "@/store/ui-store";
import { usePaymentStore } from "@/store/payment-store";
import type { InvoiceData } from "@/lib/invoices/types";
import { formatInvoiceMoney } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";
import type {
  MilestoneWithDetails,
  PaymentsViewClientProps,
} from "./types";

export type { MilestoneWithDetails, PaymentsViewClientProps } from "./types";

export function PaymentsViewClient({
  projectId,
  milestones,
  payments,
  invoices = [],
  userRole,
  deliverablesList,
}: PaymentsViewClientProps) {
  const router = useRouter();

  const setCreateMilestoneOpen = useUIStore((state) => state.setCreateMilestoneOpen);
  const setPayModalMilestone = usePaymentStore((state) => state.setPayModalMilestone);
  const setSelectedMethod = usePaymentStore((state) => state.setSelectedMethod);
  const setReferenceNote = usePaymentStore((state) => state.setReferenceNote);

  // Invoices Modals & Active Tab
  const [activeTab, setActiveTab] = useState<"milestones" | "invoices">("milestones");
  const [isInvoiceBuilderOpen, setIsInvoiceBuilderOpen] = useState(false);
  const [builderMilestone, setBuilderMilestone] = useState<MilestoneWithDetails | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);

  const isAgency = userRole === "owner" || userRole === "agency";
  const paymentRecordMap = new Map(payments.map((p) => [p.milestoneId, p]));
  const milestoneInvoiceMap = new Map(
    invoices.filter((inv) => inv.milestoneId).map((inv) => [inv.milestoneId!, inv])
  );

  const formatMoney = (amountInUnits: number, curr: string = "INR") => {
    const mainUnits = amountInUnits / 100;
    if (curr === "USD") {
      return `$${mainUnits.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `₹${mainUnits.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const handleOpenPaymentModal = (milestone: MilestoneWithDetails) => {
    setPayModalMilestone(milestone);
    setSelectedMethod("upi");
    setReferenceNote("");
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Delete this payment milestone?")) return;
    try {
      const res = await axios.delete(`/api/milestones?milestoneId=${milestoneId}`);
      if (res.data.success) {
        toast.success("Milestone deleted");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Failed to delete milestone"
        : "Failed to delete milestone";
      toast.error(message);
    }
  };

  const handleOpenInvoiceBuilder = (milestone?: MilestoneWithDetails) => {
    setBuilderMilestone(milestone || null);
    setIsInvoiceBuilderOpen(true);
  };

  const handleDownloadInvoicePdf = (inv: InvoiceData) => {
    if (inv.pdfUrl) {
      window.open(inv.pdfUrl, "_blank");
    } else {
      setPreviewInvoice(inv);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance">
            Payments & Invoices
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage project milestones, track payment receipts, and issue branded invoices.
          </p>
        </div>

        {isAgency && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handleOpenInvoiceBuilder()}
              className="active:scale-[0.96] transition-transform h-9 px-3.5 rounded-full border border-border bg-background hover:bg-muted text-foreground font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-4 h-4 text-brand" />
              <span>Create Invoice</span>
            </button>

            <button
              onClick={() => setCreateMilestoneOpen(true)}
              className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5"
            >
              <Plus className="w-5 h-5 stroke-3" />
              <span>New Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* EvilCharts Radial Financial Breakdown Chart */}
      <PaymentsRadialChart milestones={milestones} formatMoney={formatMoney} />

      {/* Section Tabs: Milestones vs Invoices */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/40 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("milestones")}
          className={cn(
            "px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5",
            activeTab === "milestones"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Milestones</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
            {milestones.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={cn(
            "px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5",
            activeTab === "invoices"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-3.5 h-3.5 text-brand" />
          <span>Invoices</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Milestones List Section */}
      {activeTab === "milestones" && (
        <section aria-label="Project Milestones List" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
              All Scheduled Milestones ({milestones.length})
            </h2>
          </div>

          {milestones.length === 0 ? (
            <MilestonesEmptyState
              isAgency={isAgency}
              onCreateMilestone={() => setCreateMilestoneOpen(true)}
            />
          ) : (
            <div>
              {milestones.map((milestone, index) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  paymentRecord={paymentRecordMap.get(milestone.id)}
                  linkedInvoice={milestoneInvoiceMap.get(milestone.id)}
                  isAgency={isAgency}
                  formatMoney={formatMoney}
                  onMarkPaid={handleOpenPaymentModal}
                  onDeleteMilestone={handleDeleteMilestone}
                  onGenerateInvoice={handleOpenInvoiceBuilder}
                  onViewInvoice={(inv) => setPreviewInvoice(inv)}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Invoices List Section */}
      {activeTab === "invoices" && (
        <section aria-label="Project Invoices List" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
              All Project Invoices ({invoices.length})
            </h2>
            {isAgency && (
              <button
                type="button"
                onClick={() => handleOpenInvoiceBuilder()}
                className="text-xs text-brand hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border/60 bg-card/20 space-y-3">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No invoices created yet
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Issue professional split-pane invoices, sync them with milestones, and send them directly to clients.
                </p>
              </div>
              {isAgency && (
                <button
                  type="button"
                  onClick={() => handleOpenInvoiceBuilder()}
                  className="h-8 px-3.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Invoice</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden bg-card/20">
              {invoices.map((inv) => {
                const isPaid = inv.status === "paid";
                return (
                  <div
                    key={inv.id}
                    className="p-3.5 sm:px-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Left: Number, Status & Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: inv.themeColor || "#00AAF7" }}
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="text-sm font-bold text-foreground font-mono hover:text-brand transition-colors truncate"
                          >
                            {inv.invoiceNumber}
                          </button>
                          <span
                            className={cn(
                              "px-2 py-0.2 rounded text-[10px] font-semibold tracking-wide uppercase shrink-0",
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : inv.status === "sent" || inv.status === "viewed"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : inv.status === "overdue"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          To: {(inv.clientSnapshot as any)?.name || "Client"}
                          {inv.milestoneId && " • Linked to milestone"}
                        </p>
                      </div>
                    </div>

                    {/* Right: Dates, Total & Actions */}
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end w-full sm:w-auto">
                      <div className="text-right text-xs text-muted-foreground hidden sm:block">
                        <div>
                          Due: {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>

                      <div className="text-sm font-bold text-foreground font-mono tabular-nums min-w-20 text-right">
                        {formatInvoiceMoney(inv.total, inv.currency)}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(inv)}
                          className="h-7 px-2.5 rounded-md border border-border/60 hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1 transition-colors"
                          title="View invoice"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="hidden sm:inline">View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadInvoicePdf(inv)}
                          className="h-7 w-7 rounded-md border border-border/60 hover:bg-muted text-foreground flex items-center justify-center transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Confirm Payment Drawer */}
      <PaymentConfirmModal formatMoney={formatMoney} />

      {/* Create Milestone Drawer */}
      <CreateMilestoneModal projectId={projectId} deliverablesList={deliverablesList} />

      {/* Invoice Split-Pane Builder Modal */}
      <InvoiceBuilderModal
        isOpen={isInvoiceBuilderOpen}
        onClose={() => {
          setIsInvoiceBuilderOpen(false);
          setBuilderMilestone(null);
        }}
        projectId={projectId}
        initialMilestoneId={builderMilestone?.id}
        initialMilestone={builderMilestone}
      />

      {/* Invoice Document Preview Modal */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        isAgency={isAgency}
      />
    </div>
  );
}
