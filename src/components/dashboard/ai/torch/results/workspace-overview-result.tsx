"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, CircleDot } from "lucide-react";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const DELIVERABLE_STATUS_LABEL: Record<string, string> = {
  in_review: "In review",
  revision_requested: "Revision",
  approved: "Approved",
  pending: "Pending",
};

const STATUS_TONE: Record<string, string> = {
  in_review: "text-brand bg-brand/10",
  revision_requested: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  approved: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  pending: "text-muted-foreground bg-muted",
};

function formatStatus(status: string): string {
  return DELIVERABLE_STATUS_LABEL[status] ?? status;
}

/**
 * Renders the `queryWorkspaceOverview` tool result as a real deliverables
 * table + compact counts, not a markdown table the model re-types.
 */
export function WorkspaceOverviewResult({ result }: { result: unknown }) {
  if (!isRecord(result)) return null;
  if (typeof result.error === "string") return null;

  const total = typeof result.totalProjects === "number" ? result.totalProjects : 0;
  const active = typeof result.activeProjects === "number" ? result.activeProjects : 0;
  const inReviewCount =
    typeof result.inReviewDeliverablesCount === "number"
      ? result.inReviewDeliverablesCount
      : 0;
  const pipeline =
    typeof result.totalProposalPipeline === "number" ? result.totalProposalPipeline : 0;
  const inReview = Array.isArray(result.inReviewDeliverables)
    ? result.inReviewDeliverables.filter(isRecord)
    : [];
  const projects = Array.isArray(result.projects)
    ? result.projects.filter(isRecord)
    : [];

  const hasDeliverables = inReview.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2.5">
        <LayoutDashboard className="h-3.5 w-3.5 text-brand" />
        <span className="text-xs font-semibold text-foreground">
          Workspace overview
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CircleDot className="h-3 w-3" />
          {active} active · {total} total
        </span>
      </div>

      <div className="flex divide-x divide-border/60 text-center">
        <CountCell label="In review" value={inReviewCount} tone="text-brand" />
        <CountCell label="Projects" value={total} />
        <CountCell label="Pipeline" value={pipeline} mono />
      </div>

      {hasDeliverables ? (
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2 font-medium">Deliverable</th>
                <th className="px-3.5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {inReview.map((d, i) => {
                const title = typeof d.title === "string" ? d.title : "Untitled";
                const status = typeof d.status === "string" ? d.status : "pending";
                return (
                  <tr key={typeof d.id === "string" ? d.id : i} className="text-foreground">
                    <td className="px-3.5 py-2 font-medium">{title}</td>
                    <td className="px-3.5 py-2">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          STATUS_TONE[status] ?? STATUS_TONE.pending
                        }`}
                      >
                        {formatStatus(status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-border/60 px-3.5 py-3 text-[11px] text-muted-foreground">
          {projects.length === 0
            ? "No projects in this workspace yet."
            : "Nothing currently in review across your projects."}
        </div>
      )}
    </motion.div>
  );
}

function CountCell({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: number;
  tone?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex-1 px-2 py-2.5">
      <div
        className={`text-sm font-semibold tabular-nums ${tone ?? "text-foreground"} ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
