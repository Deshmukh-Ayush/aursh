"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Zap, 
  Trash2, 
  Link as LinkIcon,
  ShieldCheck,
  Building2,
  QrCode,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

export type MilestoneWithDetails = {
  id: string;
  projectId: string;
  proposalId: string | null;
  deliverableId: string | null;
  deliverableTitle?: string | null;
  title: string;
  description: string | null;
  amount: number; // in paise / cents
  currency: string;
  triggerType: "upfront" | "on_approval" | "on_date" | "manual";
  dueDate: Date | null;
  status: "upcoming" | "due" | "overdue" | "paid" | "waived";
  createdAt: Date;
};

export type PaymentRecord = {
  id: string;
  milestoneId: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  referenceNote?: string | null;
  status: string;
  paidAt: Date | null;
};

type PaymentsViewClientProps = {
  projectId: string;
  milestones: MilestoneWithDetails[];
  payments: PaymentRecord[];
  currentUserId: string;
  userRole: "owner" | "agency" | "client";
  deliverablesList: Array<{ id: string; title: string }>;
};

const TABS = [
  { id: "all", label: "All Milestones" },
  { id: "due", label: "Due & Overdue" },
  { id: "paid", label: "Paid" },
  { id: "upcoming", label: "Upcoming" },
];

export function PaymentsViewClient({
  projectId,
  milestones,
  payments,
  currentUserId,
  userRole,
  deliverablesList,
}: PaymentsViewClientProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
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

  // Map payments by milestoneId
  const paymentRecordMap = new Map(payments.map((p) => [p.milestoneId, p]));

  // Financial Calculations
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
        setTitle("");
        setDescription("");
        setAmount("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create milestone");
    } finally {
      setIsSubmitting(false);
    }
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
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to confirm payment");
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
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete milestone");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Information Banner */}
      <div className="p-3.5 px-4 rounded-[16px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Direct Agency Payment Tracking</span>
            <p className="text-muted-foreground text-[12px] mt-0.5">
              Clients pay agencies directly via UPI, Bank Transfer, or Payment Link. Mark milestones as received to release deliverables.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
            Project Financials & Milestones
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Track revenue, payment milestones, and release deliverable approvals.
          </p>
        </div>

        {isAgency && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="active:scale-[0.96] transition-transform duration-150 h-9 px-4 rounded-full bg-foreground text-background font-medium text-[13px] shadow-xs hover:opacity-90 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            New Milestone
          </button>
        )}
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Project Value</span>
          <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
            {formatMoney(totalProjectValue)}
          </div>
          <p className="text-[11px] text-muted-foreground">{milestones.length} total milestone(s)</p>
        </div>

        <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Collected</span>
          <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
            {formatMoney(totalPaid)}
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="bg-foreground h-full transition-all duration-300" style={{ width: `${paidPercentage}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding</span>
          <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
            {formatMoney(totalOutstanding)}
          </div>
          <p className="text-[11px] text-muted-foreground">{100 - paidPercentage}% remaining</p>
        </div>

        <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Overdue</span>
          <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
            {overdueCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Action required</p>
        </div>
      </div>

      {/* Mini Navbar Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <nav className="relative p-1 rounded-full bg-muted/60 dark:bg-neutral-900/80 border border-border/40 inline-flex gap-1 shadow-xs overflow-x-auto max-w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = milestones.filter((m) => {
              if (tab.id === "all") return true;
              if (tab.id === "due") return m.status === "due" || m.status === "overdue";
              if (tab.id === "paid") return m.status === "paid";
              if (tab.id === "upcoming") return m.status === "upcoming";
              return true;
            }).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 flex items-center gap-2 z-10 select-none shrink-0 ${
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="payments-tab-pill"
                    className="absolute inset-0 rounded-full bg-background shadow-xs ring-1 ring-black/5 dark:ring-white/10 z-[-1]"
                    transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                  />
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] tabular-nums px-1.5 py-0.2 rounded-full ${isActive ? "bg-muted text-foreground" : "text-muted-foreground/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inline Milestone List */}
      {filteredMilestones.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-border/60 p-16 flex flex-col items-center justify-center text-center bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
            <CreditCard className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">No payment milestones</h3>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Payment milestones will be automatically created when proposals are accepted, or you can add them manually.
          </p>
          {isAgency && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="active:scale-[0.96] transition-transform duration-150 mt-5 rounded-full px-4 py-2 bg-foreground text-background text-[13px] font-medium shadow-xs"
            >
              Create First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] border border-border/40 bg-card overflow-hidden divide-y divide-border/30 shadow-xs">
          {filteredMilestones.map((m, i) => {
            const isDueOrOverdue = m.status === "due" || m.status === "overdue";
            const isPaid = m.status === "paid";
            const pRec = paymentRecordMap.get(m.id);

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors duration-150 group"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted/70 dark:bg-neutral-800 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                    {isPaid ? (
                      <CheckCircle2 className="w-5 h-5 text-foreground stroke-[2]" />
                    ) : isDueOrOverdue ? (
                      <Zap className="w-5 h-5 text-foreground stroke-[2]" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground stroke-[1.5]" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold tracking-tight text-foreground truncate max-w-[240px] sm:max-w-md">
                        {m.title}
                      </span>
                      {m.triggerType === "upfront" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/60">
                          100% Upfront
                        </span>
                      )}
                      {m.triggerType === "on_approval" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/60">
                          On Approval
                        </span>
                      )}
                    </div>

                    {m.description && (
                      <p className="text-[12px] text-muted-foreground line-clamp-1">{m.description}</p>
                    )}

                    {m.deliverableTitle && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <LinkIcon className="w-3 h-3" />
                        <span>Linked to: {m.deliverableTitle}</span>
                      </div>
                    )}

                    {pRec && pRec.referenceNote && (
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Ref/UTR: {pRec.referenceNote} ({pRec.paymentMethod?.toUpperCase()})
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
                  {/* Amount Display */}
                  <div className="text-left sm:text-right">
                    <div className="text-[16px] font-semibold tracking-tight text-foreground tabular-nums">
                      {formatMoney(m.amount, m.currency)}
                    </div>
                    <div className="text-[11px] text-muted-foreground capitalize">
                      {m.status === "paid" ? "Paid" : m.status === "due" ? "Payment Due" : m.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <button
                        onClick={() => setPayModalMilestone(m)}
                        className="active:scale-[0.96] transition-transform duration-150 h-8 px-3 text-[12px] rounded-lg bg-foreground text-background font-medium shadow-xs flex items-center gap-1.5"
                      >
                        <span>Mark Paid</span>
                      </button>
                    )}

                    {isAgency && (
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="active:scale-[0.96] transition-transform duration-150 h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Manual Payment Verification Modal */}
      <AnimatePresence>
        {payModalMilestone && (
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
                  onClick={() => setPayModalMilestone(null)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                <div className="text-[12px] font-medium text-muted-foreground">Milestone:</div>
                <div className="text-[15px] font-semibold text-foreground">{payModalMilestone.title}</div>
                <div className="text-[22px] font-bold text-foreground tabular-nums">
                  {formatMoney(payModalMilestone.amount, payModalMilestone.currency)}
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
                        onClick={() => setSelectedMethod(method.id)}
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
                    onChange={(e) => setReferenceNote(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setPayModalMilestone(null)}
                  className="active:scale-[0.96] transition-transform duration-150 px-4 py-2 rounded-full border border-border/60 text-[13px] font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className="active:scale-[0.96] transition-transform duration-150 px-5 py-2 rounded-full bg-foreground text-background text-[13px] font-medium shadow-xs hover:opacity-90 flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5 stroke-[2]" />
                  {isSubmitting ? "Confirming..." : "Confirm Payment Received"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Milestone Modal */}
      <AnimatePresence>
        {isAddOpen && (
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
                  onClick={() => setIsAddOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMilestone} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-foreground">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50% Upfront or Landing Page Approval"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-foreground">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
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
                    onChange={(e) => setTriggerType(e.target.value)}
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
                      onChange={(e) => setSelectedDeliverableId(e.target.value)}
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

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
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
        )}
      </AnimatePresence>
    </div>
  );
}
