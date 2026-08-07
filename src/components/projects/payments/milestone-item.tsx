"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Trash2, Zap, ArrowRight, Receipt } from "lucide-react";
import type { MilestoneWithDetails, PaymentRecord } from "@/store/types";
import { SealCheckIcon } from "@phosphor-icons/react";

type MilestoneItemProps = {
  milestone: MilestoneWithDetails;
  paymentRecord: PaymentRecord | undefined;
  isAgency: boolean;
  formatMoney: (amountInUnits: number, curr?: string) => string;
  onMarkPaid: (milestone: MilestoneWithDetails) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  index: number;
};

export function MilestoneItem({
  milestone,
  paymentRecord,
  isAgency,
  formatMoney,
  onMarkPaid,
  onDeleteMilestone,
  index,
}: MilestoneItemProps) {
  const getStatusConfig = () => {
    switch (milestone.status) {
      case "paid":
        return {
          label: "Paid",
          Icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      case "overdue":
        return {
          label: "Overdue",
          Icon: Zap,
          color: "text-rose-500 animate-pulse",
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        };
      case "due":
        return {
          label: "Due",
          Icon: Zap,
          color: "text-blue-500",
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          label: "Upcoming",
          Icon: Clock,
          color: "text-slate-400",
          bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.Icon;
  const isPaid = milestone.status === "paid";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors rounded-md"
    >
      {/* Left: Icon, Title & Badge */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <StatusIcon className={`w-4 h-4 shrink-0 ${status.color}`} />
        
        <span className="text-sm font-medium text-foreground truncate max-w-50 sm:max-w-xs">
          {milestone.title}
        </span>
        
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${status.bg} shrink-0`}>
          {status.label}
        </span>
      </div>

      {/* Right: Date, Amount & Actions */}
      <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 ml-7 sm:ml-0">
        
        {/* Due Date */}
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {milestone.dueDate 
            ? new Date(milestone.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) 
            : "-"}
        </div>

        {/* Amount */}
        <div className="text-sm font-semibold tabular-nums tracking-tight min-w-20 text-right">
          {formatMoney(milestone.amount, milestone.currency)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-22.5 justify-end">
          {isPaid ? (
            paymentRecord?.referenceNote ? (
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-500/10 dark:text-emerald-400" title={paymentRecord.referenceNote}>
                <Receipt className="w-3 h-3" />
                <span className="truncate max-w-15">{paymentRecord.referenceNote}</span>
              </div>
            ) : (
              <SealCheckIcon  className="w-5 h-5 text-emerald-500" />
            )
          ) : (
            <button
              onClick={() => onMarkPaid(milestone)}
              className="flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium rounded-full bg-[#00AAF7] text-white hover:bg-[#0088c4] hover:text-white transition-colors"
            >
              Pay <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isAgency && (
            <button
              onClick={() => onDeleteMilestone(milestone.id)}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Delete milestone"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}