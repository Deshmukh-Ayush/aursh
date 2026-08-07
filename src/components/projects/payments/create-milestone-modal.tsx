"use client";

import { Drawer } from "vaul";
import { Plus, X, Calendar } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { usePaymentStore } from "@/store/payment-store";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type CreateMilestoneModalProps = {
  projectId: string;
  deliverablesList: Array<{ id: string; title: string }>;
};

export function CreateMilestoneModal({ projectId, deliverablesList }: CreateMilestoneModalProps) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isOpen = useUIStore((state) => state.isCreateMilestoneOpen);
  const setCreateMilestoneOpen = useUIStore((state) => state.setCreateMilestoneOpen);

  const title = usePaymentStore((state) => state.title);
  const description = usePaymentStore((state) => state.description);
  const amount = usePaymentStore((state) => state.amount);
  const currency = usePaymentStore((state) => state.currency);
  const triggerType = usePaymentStore((state) => state.triggerType);
  const selectedDeliverableId = usePaymentStore((state) => state.selectedDeliverableId);
  const dueDate = usePaymentStore((state) => state.dueDate);
  const isSubmitting = usePaymentStore((state) => state.isSubmitting);

  const setTitle = usePaymentStore((state) => state.setTitle);
  const setDescription = usePaymentStore((state) => state.setDescription);
  const setAmount = usePaymentStore((state) => state.setAmount);
  const setCurrency = usePaymentStore((state) => state.setCurrency);
  const setTriggerType = usePaymentStore((state) => state.setTriggerType);
  const setSelectedDeliverableId = usePaymentStore((state) => state.setSelectedDeliverableId);
  const setDueDate = usePaymentStore((state) => state.setDueDate);
  const setIsSubmitting = usePaymentStore((state) => state.setIsSubmitting);
  const resetCreateForm = usePaymentStore((state) => state.resetCreateForm);

  const handleClose = () => {
    setCreateMilestoneOpen(false);
    resetCreateForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        handleClose();
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
                  Create Payment Milestone
                </Drawer.Title>
                <Drawer.Description className="text-xs text-muted-foreground mt-0.5">
                  Set up an upfront deposit, deliverable-linked, or date-based milestone.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% Deposit or Mobile App Delivery Approval"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add context or notes for this payment milestone..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Amount</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 tabular-nums font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-semibold"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Trigger Condition</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium"
                >
                  <option value="manual">Manual Verification Request</option>
                  <option value="upfront">100% Upfront Deposit</option>
                  <option value="on_approval">On Deliverable Approval</option>
                  <option value="on_date">Specific Due Date</option>
                </select>
              </div>

              {triggerType === "on_approval" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Link to Deliverable</label>
                  <select
                    value={selectedDeliverableId}
                    onChange={(e) => setSelectedDeliverableId(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium"
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Due Date (Optional)</label>
                <div 
                  className="relative flex items-center cursor-pointer"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                >
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={dueDate}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 pl-3 pr-10 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-muted-foreground absolute right-3 pointer-events-none" />
                </div>
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
                  type="submit"
                  disabled={isSubmitting}
                  className="active:scale-[0.96] transition-transform h-9 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-md hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmitting ? "Creating..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
