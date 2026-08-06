"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Link as LinkIcon, Trash2, Zap } from "lucide-react";
import type { MilestoneWithDetails, PaymentRecord } from "./types";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors duration-150 group"
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-muted/70 dark:bg-neutral-800 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
          {isPaid ? (
            <CheckCircle2 className="w-5 h-5 text-foreground stroke-2" />
          ) : isDueOrOverdue ? (
            <Zap className="w-5 h-5 text-foreground stroke-2" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground stroke-[1.5]" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold tracking-tight text-foreground truncate max-w-60 sm:max-w-md">
              {milestone.title}
            </span>
            {milestone.triggerType === "upfront" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/60">
                100% Upfront
              </span>
            )}
            {milestone.triggerType === "on_approval" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/60">
                On Approval
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="text-[12px] text-muted-foreground line-clamp-1">{milestone.description}</p>
          )}

          {milestone.deliverableTitle && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <LinkIcon className="w-3 h-3" />
              <span>Linked to: {milestone.deliverableTitle}</span>
            </div>
          )}

          {paymentRecord && paymentRecord.referenceNote && (
            <div className="text-[11px] text-muted-foreground font-mono">
              Ref/UTR: {paymentRecord.referenceNote} ({paymentRecord.paymentMethod?.toUpperCase()})
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
        <div className="text-left sm:text-right">
          <div className="text-[16px] font-semibold tracking-tight text-foreground tabular-nums">
            {formatMoney(milestone.amount, milestone.currency)}
          </div>
          <div className="text-[11px] text-muted-foreground capitalize">
            {milestone.status === "paid" ? "Paid" : milestone.status === "due" ? "Payment Due" : milestone.status}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPaid && (
            <button
              onClick={() => onMarkPaid(milestone)}
              className="active:scale-[0.96] transition-transform duration-150 h-8 px-3 text-[12px] rounded-lg bg-foreground text-background font-medium shadow-xs flex items-center gap-1.5"
            >
              <span>Mark Paid</span>
            </button>
          )}

          {isAgency && (
            <button
              onClick={() => onDeleteMilestone(milestone.id)}
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
}
