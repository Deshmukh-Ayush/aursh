"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, Clock, CalendarClock } from "lucide-react";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const STATUS_META: Record<
  string,
  { label: string; icon: typeof DollarSign; tone: string }
> = {
  paid: { label: "Collected", icon: DollarSign, tone: "text-emerald-600 dark:text-emerald-400" },
  due: { label: "Due", icon: Clock, tone: "text-foreground" },
  overdue: { label: "Overdue", icon: AlertTriangle, tone: "text-red-600 dark:text-red-400" },
  upcoming: { label: "Upcoming", icon: CalendarClock, tone: "text-muted-foreground" },
};

/**
 * Renders the `analyzeFinancials` tool result as a compact financial summary
 * (collected / due / overdue / upcoming) with a milestones breakdown, not a
 * wall of markdown bullets.
 */
export function FinancialsResult({ result }: { result: unknown }) {
  if (!isRecord(result)) return null;
  if (typeof result.error === "string") return null;

  const currency = typeof result.currency === "string" ? result.currency : "USD";
  const summary = isRecord(result.summary) ? result.summary : {};
  const milestones = Array.isArray(result.milestones)
    ? result.milestones.filter(isRecord)
    : [];
  const milestonesCount =
    typeof result.milestonesCount === "number" ? result.milestonesCount : milestones.length;

  const amounts: Array<{ key: string; amount: number }> = [
    { key: "collected", amount: toNum(summary.collected) },
    { key: "due", amount: toNum(summary.due) },
    { key: "overdue", amount: toNum(summary.overdue) },
    { key: "upcoming", amount: toNum(summary.upcoming) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Financial summary</span>
        <span className="ml-auto text-[13px] text-muted-foreground">
          {milestonesCount} milestone{milestonesCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border/40 sm:grid-cols-4 sm:divide-y-0">
        {amounts.map(({ key, amount }) => {
          const meta = STATUS_META[key] ?? {
            label: key,
            icon: DollarSign,
            tone: "text-foreground",
          };
          const Icon = meta.icon;
          return (
            <div key={key} className="px-4 py-2.5">
              <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                <Icon className="h-3 w-3" />
                {meta.label}
              </div>
              <div className={`mt-0.5 text-base font-semibold tabular-nums ${meta.tone}`}>
                {formatMoney(amount, currency)}
              </div>
            </div>
          );
        })}
      </div>

      {milestones.length > 0 && (
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Milestone</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {milestones.map((m, i) => {
                const title = typeof m.title === "string" ? m.title : "Untitled";
                const amount = toNum(m.amount);
                const status = typeof m.status === "string" ? m.status : "upcoming";
                const meta = STATUS_META[status] ?? STATUS_META.upcoming;
                return (
                  <tr key={typeof m.id === "string" ? m.id : i} className="text-foreground">
                    <td className="px-4 py-2 font-medium">{title}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {formatMoney(amount, currency)}
                    </td>
                    <td className={`px-4 py-2 text-right ${meta.tone}`}>{meta.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function toNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function formatMoney(amount: number, currency: string): string {
  const mainUnits = amount / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(mainUnits);
  return formatted;
}
