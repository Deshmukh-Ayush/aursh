"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { PaymentsSummaryCards } from "./payments-summary-cards";
import { PaymentsTabs } from "./payments-tabs";
import { MilestonesEmptyState } from "./milestones-empty-state";
import { MilestoneItem } from "./milestone-item";
import { PaymentConfirmModal } from "./payment-confirm-modal";
import { CreateMilestoneModal } from "./create-milestone-modal";
import { useUIStore, PaymentsTabKey } from "@/store/ui-store";
import { usePaymentStore } from "@/store/payment-store";
import type {
  MilestoneWithDetails,
  PaymentsTab,
  PaymentsViewClientProps,
} from "./types";

export type { MilestoneWithDetails, PaymentsViewClientProps } from "./types";

const TABS: PaymentsTab[] = [
  { id: "all", label: "All Milestones" },
  { id: "due", label: "Due & Overdue" },
  { id: "paid", label: "Paid" },
  { id: "upcoming", label: "Upcoming" },
];

export function PaymentsViewClient({
  projectId,
  milestones,
  payments,
  userRole,
  deliverablesList,
}: PaymentsViewClientProps) {
  const router = useRouter();

  const activeTab = useUIStore((state) => state.activePaymentTab);
  const setActiveTab = useUIStore((state) => state.setActivePaymentTab);
  const setCreateMilestoneOpen = useUIStore((state) => state.setCreateMilestoneOpen);

  const setPayModalMilestone = usePaymentStore((state) => state.setPayModalMilestone);
  const setSelectedMethod = usePaymentStore((state) => state.setSelectedMethod);
  const setReferenceNote = usePaymentStore((state) => state.setReferenceNote);

  const isAgency = userRole === "owner" || userRole === "agency";
  const paymentRecordMap = new Map(payments.map((p) => [p.milestoneId, p]));

  const totalProjectValue = milestones.reduce((sum, m) => sum + m.amount, 0);
  const totalPaid = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amount, 0);
  const totalOutstanding = totalProjectValue - totalPaid;
  const overdueCount = milestones.filter(
    (m) => m.status === "overdue" || (m.status === "due" && m.dueDate && new Date(m.dueDate) < new Date())
  ).length;

  const paidPercentage = totalProjectValue > 0 ? Math.round((totalPaid / totalProjectValue) * 100) : 0;

  const formatMoney = (amountInUnits: number, curr: string = "INR") => {
    const mainUnits = amountInUnits / 100;
    if (curr === "INR") {
      return `₹${mainUnits.toLocaleString("en-IN")}`;
    }
    return `$${mainUnits.toLocaleString("en-US")}`;
  };

  const filteredMilestones = milestones.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "due") return m.status === "due" || m.status === "overdue";
    if (activeTab === "paid") return m.status === "paid";
    if (activeTab === "upcoming") return m.status === "upcoming";
    return true;
  });

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground text-balance">
            Payments & Milestones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track project financial health, release milestone payments, and record transaction receipts.
          </p>
        </div>

        {isAgency && (
          <button
            onClick={() => setCreateMilestoneOpen(true)}
            className="active:scale-[0.96] transition-transform h-9 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-md hover:bg-primary/90 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-2" />
            <span>New Milestone</span>
          </button>
        )}
      </div>

      {/* Unified Metric Hero Bar */}
      <PaymentsSummaryCards
        projectValue={totalProjectValue}
        collected={totalPaid}
        outstanding={totalOutstanding}
        overdueCount={overdueCount}
        paidPercentage={paidPercentage}
        milestonesCount={milestones.length}
        formatMoney={formatMoney}
      />

      {/* Tab Filter */}
      <PaymentsTabs
        activeTab={activeTab}
        onTabChange={(tab: PaymentsTabKey) => setActiveTab(tab)}
        milestones={milestones}
        tabs={TABS}
      />

      {/* Milestones List or Empty State */}
      {filteredMilestones.length === 0 ? (
        <MilestonesEmptyState
          isAgency={isAgency}
          onCreateMilestone={() => setCreateMilestoneOpen(true)}
        />
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30 shadow-xs">
          {filteredMilestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              paymentRecord={paymentRecordMap.get(milestone.id)}
              isAgency={isAgency}
              formatMoney={formatMoney}
              onMarkPaid={handleOpenPaymentModal}
              onDeleteMilestone={handleDeleteMilestone}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Confirm Payment Drawer */}
      <PaymentConfirmModal formatMoney={formatMoney} />

      {/* Create Milestone Drawer */}
      <CreateMilestoneModal projectId={projectId} deliverablesList={deliverablesList} />
    </div>
  );
}
