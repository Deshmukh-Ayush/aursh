"use client";

import { useState } from "react";
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
import type {
  MilestoneWithDetails,
  PaymentsTab,
  PaymentsTabKey,
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
  const [activeTab, setActiveTab] = useState<PaymentsTabKey>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payModalMilestone, setPayModalMilestone] = useState<MilestoneWithDetails | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("upi");
  const [referenceNote, setReferenceNote] = useState<string>("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [triggerType, setTriggerType] = useState<string>("manual");
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  const router = useRouter();

  const isAgency = userRole === "owner" || userRole === "agency";

  const paymentRecordMap = new Map(payments.map((p) => [p.milestoneId, p]));

  const totalProjectValue = milestones.reduce((sum, m) => sum + m.amount, 0);
  const totalPaid = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amount, 0);
  const totalOutstanding = totalProjectValue - totalPaid;
  const overdueCount = milestones.filter((m) => m.status === "overdue" || (m.status === "due" && m.dueDate && new Date(m.dueDate) < new Date())).length;

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

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setAmount("");
    setCurrency("INR");
    setTriggerType("manual");
    setSelectedDeliverableId("");
    setDueDate("");
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedAmount = Math.round(parseFloat(amount) * 100);
      const res = await axios.post("/api/milestones", {
        projectId,
        title,
        description,
        amount: parsedAmount,
        currency,
        triggerType,
        deliverableId: selectedDeliverableId || null,
        dueDate: dueDate || null,
      });

      if (res.data.success) {
        toast.success("Milestone created");
        setIsAddOpen(false);
        resetCreateForm();
        router.refresh();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Failed to create milestone"
        : "Failed to create milestone";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (milestone: MilestoneWithDetails) => {
    setPayModalMilestone(milestone);
    setSelectedMethod("upi");
    setReferenceNote("");
  };

  const handleConfirmPayment = async () => {
    if (!payModalMilestone) return;
    setIsSubmitting(true);

    try {
      const res = await axios.post("/api/milestones/mark-paid", {
        milestoneId: payModalMilestone.id,
        paymentMethod: selectedMethod,
        referenceNote,
      });

      if (res.data.success) {
        toast.success("Payment marked as received");
        setPayModalMilestone(null);
        setReferenceNote("");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Failed to confirm payment"
        : "Failed to confirm payment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
            Payments
          </h1>
          
        </div>

        {isAgency && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="active:scale-[0.96] transition-transform duration-150 h-9 px-4 rounded-full bg-foreground text-background font-medium text-[13px] shadow-xs hover:opacity-90 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-2" />
            New Milestone
          </button>
        )}
      </div>

      <PaymentsSummaryCards
        projectValue={totalProjectValue}
        collected={totalPaid}
        outstanding={totalOutstanding}
        overdueCount={overdueCount}
        paidPercentage={paidPercentage}
        milestonesCount={milestones.length}
        formatMoney={formatMoney}
      />

      <PaymentsTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        milestones={milestones}
        tabs={TABS}
      />

      {filteredMilestones.length === 0 ? (
        <MilestonesEmptyState
          isAgency={isAgency}
          onCreateMilestone={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="rounded-[20px] border border-border/40 bg-card overflow-hidden divide-y divide-border/30 shadow-xs">
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

      <PaymentConfirmModal
        milestone={payModalMilestone}
        selectedMethod={selectedMethod}
        referenceNote={referenceNote}
        isSubmitting={isSubmitting}
        onClose={() => setPayModalMilestone(null)}
        onMethodChange={setSelectedMethod}
        onReferenceChange={setReferenceNote}
        onConfirm={handleConfirmPayment}
        formatMoney={formatMoney}
      />

      <CreateMilestoneModal
        isOpen={isAddOpen}
        isSubmitting={isSubmitting}
        title={title}
        description={description}
        amount={amount}
        currency={currency}
        triggerType={triggerType}
        selectedDeliverableId={selectedDeliverableId}
        dueDate={dueDate}
        deliverablesList={deliverablesList}
        onClose={() => setIsAddOpen(false)}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onAmountChange={setAmount}
        onCurrencyChange={setCurrency}
        onTriggerTypeChange={setTriggerType}
        onDeliverableChange={setSelectedDeliverableId}
        onDueDateChange={setDueDate}
        onSubmit={handleCreateMilestone}
      />
    </div>
  );
}
