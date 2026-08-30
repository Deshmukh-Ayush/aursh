"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileCheck2, FileX2, AlertTriangle } from "lucide-react";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const SCOPE_STATUS_LABEL: Record<string, string> = {
  within_scope: "Within scope",
  limit_reached: "Limit reached",
  scope_creep_alert: "Scope creep",
};

const DELIVERABLE_STATUS_LABEL: Record<string, string> = {
  in_review: "In review",
  revision_requested: "Revision requested",
  approved: "Approved",
  pending: "Pending",
};

function humanizeStatus(status: string, labelMap: Record<string, string>): string {
  return labelMap[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  const rawScopeStatus = scopeEval?.status;
  const scopeStatus = typeof rawScopeStatus === "string" ? rawScopeStatus : null;
  const isCreep =
    scopeStatus !== null && scopeStatus.toLowerCase().includes("creep");
  const isWarning =
    scopeStatus !== null &&
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
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          Scope audit{projectName ? ` · ${projectName}` : ""}
        </span>
        {scopeStatus && (
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-medium ${
              isCreep
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : isWarning
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {humanizeStatus(scopeStatus, SCOPE_STATUS_LABEL)}
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
        <div className="border-t border-border/60 px-4 py-2 text-[13px] text-muted-foreground">
          Signed contract: <span className="font-medium text-foreground">{contractFile}</span>
        </div>
      )}

      {deliverables.length > 0 && (
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-border/40">
              {deliverables.map((d, i) => {
                const title = typeof d.title === "string" ? d.title : "Untitled";
                const status = typeof d.status === "string" ? d.status : "pending";
                return (
                  <tr key={typeof d.id === "string" ? d.id : i}>
                    <td className="px-4 py-2 font-medium text-foreground">{title}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {humanizeStatus(status, DELIVERABLE_STATUS_LABEL)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {terms && Object.keys(terms).length > 0 && (
        <div className="border-t border-border/60 px-4 py-3 space-y-3">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Extracted contract terms
          </div>
          <div className="space-y-3">
            {/* Scope Items */}
            {Array.isArray(terms.scopeItems) && terms.scopeItems.length > 0 && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Scope Items ({terms.scopeItems.length})
                </div>
                <div className="space-y-1.5">
                  {terms.scopeItems.filter(isRecord).map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[13px]"
                    >
                      <div className="font-medium text-foreground">
                        {typeof item.title === "string" ? item.title : `Item ${i + 1}`}
                      </div>
                      {typeof item.description === "string" && item.description.trim() && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {Array.isArray(terms.exclusions) && terms.exclusions.length > 0 && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Exclusions ({terms.exclusions.length})
                </div>
                <div className="space-y-1.5">
                  {terms.exclusions.filter(isRecord).map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[13px]"
                    >
                      <div className="font-medium text-amber-700 dark:text-amber-300">
                        {typeof item.title === "string" ? item.title : `Exclusion ${i + 1}`}
                      </div>
                      {typeof item.description === "string" && item.description.trim() && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Limits */}
            {terms.revisionLimits != null && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                  Revision Limits
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[13px]">
                  {isRecord(terms.revisionLimits) ? (
                    <>
                      <div className="font-medium text-foreground">
                        Max revisions:{" "}
                        {typeof terms.revisionLimits.maxRevisions === "number" ||
                        typeof terms.revisionLimits.maxRevisions === "string"
                          ? String(terms.revisionLimits.maxRevisions)
                          : "Defined in agreement"}
                      </div>
                      {typeof terms.revisionLimits.description === "string" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {terms.revisionLimits.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="font-medium text-foreground">
                      {String(terms.revisionLimits)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Terms */}
            {Array.isArray(terms.paymentTerms) && terms.paymentTerms.length > 0 && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Payment Terms ({terms.paymentTerms.length})
                </div>
                <div className="space-y-1.5">
                  {terms.paymentTerms.filter(isRecord).map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[13px]"
                    >
                      <div className="font-medium text-foreground">
                        {typeof item.title === "string" ? item.title : `Term ${i + 1}`}
                      </div>
                      {typeof item.description === "string" && item.description.trim() && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom or Unrecognized Terms */}
            {Object.entries(terms)
              .filter(
                ([k]) =>
                  !["scopeItems", "exclusions", "revisionLimits", "paymentTerms"].includes(k)
              )
              .map(([k, v]) => (
                <div key={k} className="text-[13px] rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                  <span className="font-medium text-foreground">{humanizeKey(k)}: </span>
                  <span className="text-muted-foreground">{formatTerm(v)}</span>
                </div>
              ))}
          </div>
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
      <div className={`mt-1 text-base font-semibold tabular-nums ${tone ?? "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[13px] text-muted-foreground">{label}</div>
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
  if (isRecord(v)) {
    if (typeof v.title === "string" && typeof v.description === "string") {
      return `${v.title}: ${v.description}`;
    }
    if (typeof v.title === "string") return v.title;
    if (typeof v.description === "string") return v.description;
    return Object.entries(v)
      .map(([subK, subV]) => `${humanizeKey(subK)}: ${formatTerm(subV)}`)
      .join("; ");
  }
  if (Array.isArray(v)) {
    return v.map(formatTerm).join(", ");
  }
  return String(v);
}

function toNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

