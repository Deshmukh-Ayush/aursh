"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Receipt, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { formatInvoiceMoney } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const toNum = (v: unknown): number => (typeof v === "number" && !isNaN(v) ? v : 0);

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Paid", bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
  sent: { label: "Sent", bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  viewed: { label: "Viewed", bg: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400" },
  overdue: { label: "Overdue", bg: "bg-rose-500/10 dark:bg-rose-500/20", text: "text-rose-600 dark:text-rose-400" },
  draft: { label: "Draft", bg: "bg-muted", text: "text-muted-foreground" },
  void: { label: "Void", bg: "bg-muted", text: "text-muted-foreground" },
};

/**
 * Renders the `queryInvoiceStatus` tool result as a structured invoice status card:
 * summary metrics (outstanding, paid, overdue count, draft) plus an invoice list
 * with days overdue indicators.
 */
export function InvoiceStatusResult({ result }: { result: unknown }) {
  if (!isRecord(result)) return null;
  if (typeof result.error === "string") return null;

  const totalInvoices = toNum(result.totalInvoices);
  const currency = (typeof result.currency === "string" ? result.currency : "USD") as "USD" | "INR";
  const summary = isRecord(result.summary) ? result.summary : {};
  const totalOutstanding = toNum(result.totalOutstanding);
  const totalPaid = toNum(result.totalPaid);
  const totalDraft = toNum(result.totalDraft);
  const invoices = Array.isArray(result.invoices) ? result.invoices.filter(isRecord) : [];

  const draftCount = toNum(summary.draft);
  const sentCount = toNum(summary.sent);
  const viewedCount = toNum(summary.viewed);
  const paidCount = toNum(summary.paid);
  const overdueCount = toNum(summary.overdue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5 bg-muted/20">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Invoice Status Overview</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {totalInvoices} {totalInvoices === 1 ? "invoice" : "invoices"}
        </span>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border/40 sm:grid-cols-4 sm:divide-y-0 border-b border-border/40">
        {/* Outstanding */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Outstanding</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-foreground">
            {formatInvoiceMoney(totalOutstanding, currency)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {sentCount + viewedCount + overdueCount} unpaid
          </div>
        </div>

        {/* Collected / Paid */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Collected</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatInvoiceMoney(totalPaid, currency)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {paidCount} paid
          </div>
        </div>

        {/* Overdue */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className={cn("h-3 w-3", overdueCount > 0 ? "text-rose-500" : "text-muted-foreground")} />
            <span>Overdue</span>
          </div>
          <div className={cn(
            "mt-1 font-mono text-base font-bold tabular-nums",
            overdueCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
          )}>
            {overdueCount}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {overdueCount > 0 ? "Requires follow-up" : "All on track"}
          </div>
        </div>

        {/* Drafts */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>In Draft</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-foreground">
            {formatInvoiceMoney(totalDraft, currency)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {draftCount} drafted
          </div>
        </div>
      </div>

      {/* Invoice Ledger / Breakdown */}
      {invoices.length > 0 ? (
        <div className="divide-y divide-border/30 max-h-60 overflow-y-auto">
          {invoices.map((inv, idx) => {
            const invoiceNumber = typeof inv.invoiceNumber === "string" ? inv.invoiceNumber : "INV";
            const projectName = typeof inv.projectName === "string" ? inv.projectName : "Project";
            const clientName = typeof inv.clientName === "string" ? inv.clientName : "Client";
            const amount = toNum(inv.amount);
            const invCurrency = (typeof inv.currency === "string" ? inv.currency : currency) as "USD" | "INR";
            const statusKey = typeof inv.status === "string" ? inv.status.toLowerCase() : "draft";
            const badge = STATUS_BADGE[statusKey] ?? STATUS_BADGE.draft;
            const isOverdue = inv.isOverdue === true;
            const overdueDays = toNum(inv.overdueDays);

            return (
              <div
                key={typeof inv.id === "string" ? inv.id : idx}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground">{invoiceNumber}</span>
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider", badge.bg, badge.text)}>
                      {badge.label}
                    </span>
                    {isOverdue && overdueDays > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-semibold">
                        {overdueDays}d overdue
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {projectName} · {clientName}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {formatInvoiceMoney(amount, invCurrency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-muted-foreground">
          No invoices created yet.
        </div>
      )}
    </motion.div>
  );
}
