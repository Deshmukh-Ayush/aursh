"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileCheck2, FileX2, AlertTriangle } from "lucide-react";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/**
 * Renders the `auditProjectScope` tool result as a structured scope audit card:
 * contract status, revision history, deliverable tally, and any extracted
 * contract terms — not a markdown summary the model re-types.
 */
export function ScopeAuditResult({ result }: { result: unknown }) {
  if (!isRecord(result)) return null;
  if (typeof result.error === "string") return null;

  const projectName =
    typeof result.projectName === "string" ? result.projectName : undefined;
  const hasContract = result.hasSignedContract === true;
  const contractFile =
    typeof result.contractFileName === "string" ? result.contractFileName : null;
  const revisionCount = toNum(result.historicalRevisionRequestsCount);
  const totalDeliverables = toNum(result.totalDeliverables);
  const deliverables = Array.isArray(result.deliverables)
    ? result.deliverables.filter(isRecord)
    : [];
  const scopeEval = isRecord(result.scopeEvaluation) ? result.scopeEvaluation : null;
  const terms = isRecord(result.extractedTerms) ? result.extractedTerms : null;

  const scopeStatus = scopeEval?.status;
  const isCreep =
    typeof scopeStatus === "string" && scopeStatus.toLowerCase().includes("creep");
  const isWarning =
    typeof scopeStatus === "string" &&
    (scopeStatus.toLowerCase().includes("limit") ||
      scopeStatus.toLowerCase().includes("warning") ||
      scopeStatus.toLowerCase().includes("exceed"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2.5">
        <ShieldCheck className="h-3.5 w-3.5 text-brand" />
        <span className="text-xs font-semibold text-foreground">
          Scope audit{projectName ? ` · ${projectName}` : ""}
        </span>
        {scopeStatus && (
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
              isCreep
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : isWarning
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {scopeStatus}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/40">
        <ScopeStat
          icon={hasContract ? FileCheck2 : FileX2}
          label="Contract"
          value={hasContract ? "Signed" : "None"}
          tone={hasContract ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
        />
        <ScopeStat
          icon={AlertTriangle}
          label="Revisions"
          value={revisionCount}
          tone={revisionCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}
        />
        <ScopeStat label="Deliverables" value={totalDeliverables} />
      </div>

      {hasContract && contractFile && (
        <div className="border-t border-border/60 px-3.5 py-2 text-[11px] text-muted-foreground">
          Signed contract: <span className="font-medium text-foreground">{contractFile}</span>
        </div>
      )}

      {deliverables.length > 0 && (
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-border/40">
              {deliverables.map((d, i) => {
                const title = typeof d.title === "string" ? d.title : "Untitled";
                const status = typeof d.status === "string" ? d.status : "pending";
                return (
                  <tr key={typeof d.id === "string" ? d.id : i}>
                    <td className="px-3.5 py-2 font-medium text-foreground">{title}</td>
                    <td className="px-3.5 py-2 text-muted-foreground">
                      {status.replace(/_/g, " ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {terms && Object.keys(terms).length > 0 && (
        <div className="border-t border-border/60 px-3.5 py-2.5">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Extracted contract terms
          </div>
          <dl className="space-y-1">
            {Object.entries(terms).slice(0, 6).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">{humanizeKey(k)}:</dt>
                <dd className="text-foreground">{formatTerm(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </motion.div>
  );
}

function ScopeStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon?: typeof ShieldCheck;
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="px-3 py-2.5 text-center">
      {Icon && <Icon className={`mx-auto h-3.5 w-3.5 ${tone ?? "text-muted-foreground"}`} />}
      <div className={`mt-1 text-sm font-semibold tabular-nums ${tone ?? "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatTerm(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(", ");
  }
  return JSON.stringify(v);
}

function toNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
