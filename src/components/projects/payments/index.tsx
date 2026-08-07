"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { PaymentsRadialChart } from "./payments-radial-chart";
import { MilestonesEmptyState } from "./milestones-empty-state";
import { MilestoneItem } from "./milestone-item";
import { PaymentConfirmModal } from "./payment-confirm-modal";
import { CreateMilestoneModal } from "./create-milestone-modal";
import { useUIStore } from "@/store/ui-store";
import { usePaymentStore } from "@/store/payment-store";
import type {
  MilestoneWithDetails,
  PaymentsViewClientProps,
} from "./types";

export type { MilestoneWithDetails, PaymentsViewClientProps } from "./types";

export function PaymentsViewClient({
  projectId,
  milestones,
  payments,
  userRole,
  deliverablesList,
}: PaymentsViewClientProps) {
  const router = useRouter();

  const setCreateMilestoneOpen = useUIStore((state) => state.setCreateMilestoneOpen);
  const setPayModalMilestone = usePaymentStore((state) => state.setPayModalMilestone);
  const setSelectedMethod = usePaymentStore((state) => state.setSelectedMethod);
  const setReferenceNote = usePaymentStore((state) => state.setReferenceNote);

  const isAgency = userRole === "owner" || userRole === "agency";
  const paymentRecordMap = new Map(payments.map((p) => [p.milestoneId, p]));

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

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance">
            Payments
          </h1>
         
        </div>

        {isAgency && (
          <button
            onClick={() => setCreateMilestoneOpen(true)}
            className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5 stroke-3" />
            <span>New Milestone</span>
          </button>
        )}
      </div>

      {/* EvilCharts Radial Financial Breakdown Chart */}
      <PaymentsRadialChart milestones={milestones} formatMoney={formatMoney} />

      {/* Milestones List Section */}
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
                isAgency={isAgency}
                formatMoney={formatMoney}
                onMarkPaid={handleOpenPaymentModal}
                onDeleteMilestone={handleDeleteMilestone}
                index={index}
              />
            ))}
            </div>
        )}
      </section>

      {/* Confirm Payment Drawer */}
      <PaymentConfirmModal formatMoney={formatMoney} />

      {/* Create Milestone Drawer */}
      <CreateMilestoneModal projectId={projectId} deliverablesList={deliverablesList} />
    </div>
  );
}
