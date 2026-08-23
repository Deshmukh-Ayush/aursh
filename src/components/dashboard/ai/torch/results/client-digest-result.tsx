"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Newspaper, CheckCircle2, FileEdit, Clock } from "lucide-react";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

function relativeTime(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Renders the `generateClientDigest` tool result as a structured progress
 * summary card — deliverable counts by status plus recent activity — not a
 * markdown wall of text.
 */
export function ClientDigestResult({ result }: { result: unknown }) {
  if (!isRecord(result)) return null;
  if (typeof result.error === "string") return null;

  const projectName =
    typeof result.projectName === "string" ? result.projectName : undefined;
  const ds = isRecord(result.deliverablesSummary) ? result.deliverablesSummary : {};
  const activity = Array.isArray(result.recentActivityEvents)
    ? result.recentActivityEvents.filter(isRecord)
    : [];

  const buckets = [
    {
      key: "approved",
      label: "Approved",
      count: toNum(ds.approvedCount),
      items: toStringArray(ds.approvedItems),
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "inReview",
      label: "In review",
      count: toNum(ds.inReviewCount),
      items: toStringArray(ds.inReviewItems),
      icon: FileEdit,
      tone: "text-brand",
    },
    {
      key: "pending",
      label: "Pending",
      count: toNum(ds.pendingCount),
      items: toStringArray(ds.pendingItems),
      icon: Clock,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2.5">
        <Newspaper className="h-3.5 w-3.5 text-brand" />
        <span className="text-xs font-semibold text-foreground">
          Client digest{projectName ? ` · ${projectName}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/40">
        {buckets.map(({ key, label, count, icon: Icon, tone }) => (
          <div key={key} className="px-3 py-2.5 text-center">
            <Icon className={`mx-auto h-3.5 w-3.5 ${tone}`} />
            <div className="mt-1 text-sm font-semibold tabular-nums text-foreground">
              {count}
            </div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {buckets.some((b) => b.items.length > 0) && (
        <div className="space-y-2 border-t border-border/60 px-3.5 py-2.5">
          {buckets
            .filter((b) => b.items.length > 0)
            .map((b) => (
              <div key={b.key} className="text-[11px]">
                <span className={`font-medium ${b.tone}`}>{b.label}: </span>
                <span className="text-muted-foreground">{b.items.join(", ")}</span>
              </div>
            ))}
        </div>
      )}

      {activity.length > 0 && (
        <div className="border-t border-border/60 px-3.5 py-2.5">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Recent activity
          </div>
          <ul className="space-y-1">
            {activity.slice(0, 5).map((ev, i) => {
              const actor = typeof ev.actor === "string" ? ev.actor : "System";
              const type = typeof ev.type === "string" ? ev.type : "update";
              const when = relativeTime(ev.createdAt);
              return (
                <li key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-brand/60" />
                  <span className="text-foreground">{actor}</span>
                  <span className="opacity-70">·</span>
                  <span className="truncate">{type.replace(/_/g, " ")}</span>
                  {when && (
                    <span className="ml-auto shrink-0 tabular-nums opacity-70">{when}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function toNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}
