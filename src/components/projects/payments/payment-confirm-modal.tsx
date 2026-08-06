"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileCheck, X } from "lucide-react";
import type { MilestoneWithDetails } from "./types";

type PaymentConfirmModalProps = {
  milestone: MilestoneWithDetails | null;
  selectedMethod: string;
  referenceNote: string;
  isSubmitting: boolean;
  onClose: () => void;
  onMethodChange: (method: string) => void;
  onReferenceChange: (value: string) => void;
  onConfirm: () => void;
  formatMoney: (amountInUnits: number, curr?: string) => string;
};

export function PaymentConfirmModal({
  milestone,
  selectedMethod,
  referenceNote,
  isSubmitting,
  onClose,
  onMethodChange,
  onReferenceChange,
  onConfirm,
  formatMoney,
}: PaymentConfirmModalProps) {
  if (!milestone) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", duration: 0.25, bounce: 0 }}
          className="bg-card rounded-[20px] max-w-md w-full p-6 shadow-xl border border-border/50 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Confirm Payment Received</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Record payment receipt and update financial status.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2">
            <div className="text-[12px] font-medium text-muted-foreground">Milestone:</div>
            <div className="text-[15px] font-semibold text-foreground">{milestone.title}</div>
            <div className="text-[22px] font-bold text-foreground tabular-nums">
              {formatMoney(milestone.amount, milestone.currency)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-foreground">Payment Method</label>
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
                    onClick={() => onMethodChange(method.id)}
                    className={`p-2.5 rounded-xl border text-left text-[12px] font-medium transition-all ${
                      selectedMethod === method.id
                        ? "border-foreground bg-muted font-semibold text-foreground"
                        : "border-border/50 bg-background hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-foreground">UTR / Reference Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 123456789012 or GPay Txn ID"
                value={referenceNote}
                onChange={(e) => onReferenceChange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="active:scale-[0.96] transition-transform duration-150 px-4 py-2 rounded-full border border-border/60 text-[13px] font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="active:scale-[0.96] transition-transform duration-150 px-5 py-2 rounded-full bg-foreground text-background text-[13px] font-medium shadow-xs hover:opacity-90 flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 stroke-2" />
              {isSubmitting ? "Confirming..." : "Confirm Payment Received"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
