"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Link as LinkIcon, Trash2, Zap, ArrowRight, Calendar } from "lucide-react";
import type { MilestoneWithDetails, PaymentRecord } from "@/store/types";

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
  const isDueOrOverdue = milestone.status === "due" || milestone.status === "overdue";
  const isPaid = milestone.status === "paid";
  const isOverdue = milestone.status === "overdue";

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Zap className="w-3.5 h-3.5" /> Overdue
        </span>
      );
    }
    if (milestone.status === "due") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Zap className="w-3.5 h-3.5" /> Payment Due
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <Clock className="w-3.5 h-3.5" /> Upcoming
      </span>
    );
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors duration-150 group"
    >
      {/* Primary Section: Icon + Title & Context */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div
          aria-hidden="true"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            isPaid
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : isOverdue
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : isDueOrOverdue
              ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
              : "bg-muted/40 border-border/40 text-muted-foreground"
          }`}
        >
          {isPaid ? (
            <CheckCircle2 className="w-5 h-5 stroke-2" />
          ) : isDueOrOverdue ? (
            <Zap className="w-5 h-5 stroke-2" />
          ) : (
            <Clock className="w-5 h-5 stroke-2" />
          )}
        </div>

        <div className="min-w-0 space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-semibold tracking-tight text-foreground truncate max-w-sm sm:max-w-md">
              {milestone.title}
            </h3>
            {getStatusBadge()}
            {milestone.triggerType === "upfront" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/30">
                100% Upfront
              </span>
            )}
            {milestone.triggerType === "on_approval" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/30">
                On Approval
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
              {milestone.description}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-0.5">
            {milestone.deliverableTitle && (
              <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                <LinkIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">Linked: {milestone.deliverableTitle}</span>
              </div>
            )}

            {paymentRecord && paymentRecord.referenceNote && (
              <div className="text-[11px] font-mono bg-muted/40 px-2 py-0.5 rounded-md border border-border/20 text-foreground/90">
                Ref/UTR: {paymentRecord.referenceNote} ({paymentRecord.paymentMethod?.toUpperCase()})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Section: Amount, Date, and Accessible Actions */}
      <div className="flex items-center gap-5 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
        <div className="text-left sm:text-right">
          <div className="text-base font-bold tracking-tight text-foreground tabular-nums">
            {formatMoney(milestone.amount, milestone.currency)}
          </div>
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 justify-start sm:justify-end mt-0.5">
            <Calendar className="w-3 h-3 shrink-0" />
            {milestone.dueDate ? (
              <time dateTime={new Date(milestone.dueDate).toISOString()} className="tabular-nums">
                Due {new Date(milestone.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </time>
            ) : (
              <span>No due date</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPaid && (
            <button
              onClick={() => onMarkPaid(milestone)}
              aria-label={`Mark milestone "${milestone.title}" as paid`}
              className="active:scale-[0.96] transition-all duration-150 min-h-[36px] px-3.5 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Mark Paid</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-2" />
            </button>
          )}

          {isAgency && (
            <button
              onClick={() => onDeleteMilestone(milestone.id)}
              aria-label={`Delete milestone "${milestone.title}"`}
              className="active:scale-[0.96] transition-all duration-150 min-h-[36px] min-w-[36px] rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Delete Milestone"
            >
              <Trash2 className="w-4 h-4 stroke-2" />
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
