"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type CreateMilestoneModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  title: string;
  description: string;
  amount: string;
  currency: string;
  triggerType: string;
  selectedDeliverableId: string;
  dueDate: string;
  deliverablesList: Array<{ id: string; title: string }>;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onTriggerTypeChange: (value: string) => void;
  onDeliverableChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function CreateMilestoneModal({
  isOpen,
  isSubmitting,
  title,
  description,
  amount,
  currency,
  triggerType,
  selectedDeliverableId,
  dueDate,
  deliverablesList,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onAmountChange,
  onCurrencyChange,
  onTriggerTypeChange,
  onDeliverableChange,
  onDueDateChange,
  onSubmit,
}: CreateMilestoneModalProps) {
  if (!isOpen) return null;

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
              <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Create Payment Milestone</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Set up an upfront or deliverable-linked milestone.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-foreground">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. 50% Upfront or Landing Page Approval"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-foreground">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Add context for this milestone"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-foreground">Amount (INR / USD)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-foreground">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-foreground">Trigger Condition</label>
              <select
                value={triggerType}
                onChange={(e) => onTriggerTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                <option value="manual">Manual Request</option>
                <option value="upfront">100% / Upfront Payment</option>
                <option value="on_approval">On Deliverable Approval</option>
                <option value="on_date">Specific Due Date</option>
              </select>
            </div>

            {triggerType === "on_approval" && (
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-foreground">Link to Deliverable</label>
                <select
                  value={selectedDeliverableId}
                  onChange={(e) => onDeliverableChange(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  <option value="">-- Select Deliverable --</option>
                  {deliverablesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-foreground">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="active:scale-[0.96] transition-transform duration-150 px-4 py-2 rounded-full border border-border/60 text-[13px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="active:scale-[0.96] transition-transform duration-150 px-5 py-2 rounded-full bg-foreground text-background text-[13px] font-medium shadow-xs hover:opacity-90"
              >
                {isSubmitting ? "Creating..." : "Save Milestone"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
