"use client";

import { Drawer } from "vaul";
import { FileCheck, X } from "lucide-react";
import { usePaymentStore } from "@/store/payment-store";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

type PaymentConfirmModalProps = {
  formatMoney: (amountInUnits: number, curr?: string) => string;
};

export function PaymentConfirmModal({ formatMoney }: PaymentConfirmModalProps) {
  const router = useRouter();

  const milestone = usePaymentStore((state) => state.payModalMilestone);
  const selectedMethod = usePaymentStore((state) => state.selectedMethod);
  const referenceNote = usePaymentStore((state) => state.referenceNote);
  const isSubmitting = usePaymentStore((state) => state.isSubmitting);

  const setSelectedMethod = usePaymentStore((state) => state.setSelectedMethod);
  const setReferenceNote = usePaymentStore((state) => state.setReferenceNote);
  const setIsSubmitting = usePaymentStore((state) => state.setIsSubmitting);
  const resetConfirmForm = usePaymentStore((state) => state.resetConfirmForm);

  const isOpen = !!milestone;

  const handleClose = () => {
    resetConfirmForm();
  };

  const handleConfirm = async () => {
    if (!milestone) return;
    setIsSubmitting(true);

    try {
      const res = await axios.post("/api/milestones/mark-paid", {
        milestoneId: milestone.id,
        paymentMethod: selectedMethod,
        referenceNote,
      });

      if (res.data.success) {
        posthog.capture("milestone_payment_confirmed", {
          currency: milestone.currency,
          payment_method: selectedMethod,
        });
        toast.success("Payment marked as received");
        handleClose();
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

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 flex flex-col rounded-t-[24px] bg-background border-t border-border/40 shadow-2xl overflow-hidden focus:outline-hidden">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted-foreground/30 my-3" />
          <div className="overflow-y-auto px-4 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto w-full flex-1">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/40">
              <div>
                <Drawer.Title className="text-xl font-bold tracking-tight text-foreground">
                  Confirm Payment Received
                </Drawer.Title>
                <Drawer.Description className="text-xs text-muted-foreground mt-0.5">
                  Record payment receipt and log reference notes for financial audit.
                </Drawer.Description>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-[0.96]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {milestone && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Target Milestone
                  </span>
                  <div className="text-sm font-semibold text-foreground">{milestone.title}</div>
                  <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatMoney(milestone.amount, milestone.currency)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "upi", label: "UPI / GPay / PhonePe" },
                      { id: "bank_transfer", label: "Bank Transfer / NEFT" },
                      { id: "card", label: "Card / Payment Link" },
                      { id: "cash", label: "Cash / Other" },
                    ].map((method) => (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all active:scale-[0.96] ${
                          selectedMethod === method.id
                            ? "border-primary bg-primary/10 font-semibold text-foreground ring-1 ring-primary/20"
                            : "border-border/50 bg-background hover:bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    UTR / Transaction Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012 or GPay Txn ID"
                    value={referenceNote}
                    onChange={(e) => setReferenceNote(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="active:scale-[0.96] transition-transform h-9 px-4 rounded-xl border border-border/60 text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="active:scale-[0.96] transition-transform h-9 px-5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-md hover:bg-emerald-400 flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    {isSubmitting ? "Confirming..." : "Confirm Payment Received"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
