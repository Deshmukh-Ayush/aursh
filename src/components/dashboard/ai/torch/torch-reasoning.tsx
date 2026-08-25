"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  DollarSign,
  Newspaper,
  PackagePlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ToolCallStep } from "./torch-context";
import { AgentDisclosure } from "@/components/agents/agent-disclosure";
import { ThinkingShimmer } from "@/components/agents/loading-states/thinking-shimmer";
import { cn } from "@/lib/utils";

export interface TorchReasoningProps {
  toolCalls?: ToolCallStep[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

interface FormattedStep {
  title: string;
  detail: string;
  icon: LucideIcon;
}

/**
 * Per-tool formatter — maps each tool name Torch can call to a short,
 * specific, human-readable one-line summary of what that tool actually did,
 * driven by the real result shape returned from `src/lib/ai/torch-tools.ts`.
 * Falls back to a generic "Ran {name}" (never raw JSON) for unmapped tools.
 */
function formatToolStep(toolName: string, result: unknown): FormattedStep {
  switch (toolName) {
    case "queryWorkspaceOverview": {
      if (!isRecord(result)) {
        return { title: "Reviewed workspace", detail: "Loaded workspace overview", icon: LayoutDashboard };
      }
      const total = result.totalProjects;
      const active = result.activeProjects;
      const inReview = result.inReviewDeliverablesCount;
      const parts: string[] = [];
      if (typeof total === "number") {
        parts.push(`${active ?? 0} active of ${total} projects`);
      }
      if (typeof inReview === "number" && inReview > 0) {
        parts.push(`${inReview} deliverable${inReview === 1 ? "" : "s"} in review`);
      }
      return {
        title: "Reviewed workspace overview",
        detail: parts.length ? parts.join(" · ") : "No projects in this workspace yet",
        icon: LayoutDashboard,
      };
    }

    case "auditProjectScope": {
      if (!isRecord(result)) {
        return { title: "Audited project scope", detail: "Scope check complete", icon: ShieldCheck };
      }
      if (typeof result.error === "string") {
        return { title: "Audited project scope", detail: result.error, icon: ShieldCheck };
      }
      const parts: string[] = [];
      if (typeof result.projectName === "string") parts.push(result.projectName);
      if (typeof result.historicalRevisionRequestsCount === "number") {
        parts.push(`${result.historicalRevisionRequestsCount} past revision request${result.historicalRevisionRequestsCount === 1 ? "" : "s"}`);
      }
      if (typeof result.totalDeliverables === "number") {
        parts.push(`${result.totalDeliverables} deliverable${result.totalDeliverables === 1 ? "" : "s"}`);
      }
      return {
        title: "Audited project scope",
        detail: parts.length ? parts.join(" · ") : "No signed contract found to audit against",
        icon: ShieldCheck,
      };
    }

    case "generateAddendumDraft": {
      if (!isRecord(result)) {
        return { title: "Drafted change order addendum", detail: "Awaiting your approval", icon: FileText };
      }
      if (typeof result.error === "string") {
        return { title: "Drafted change order addendum", detail: result.error, icon: FileText };
      }
      const addendum = isRecord(result.addendum) ? result.addendum : {};
      const price = typeof addendum.additionalPrice === "number" ? addendum.additionalPrice : undefined;
      const currency = typeof addendum.currency === "string" ? addendum.currency : "USD";
      return {
        title: "Drafted change order addendum",
        detail:
          typeof price === "number"
            ? `+${price} ${currency} · awaiting your approval`
            : "Awaiting your approval",
        icon: FileText,
      };
    }

    case "analyzeFinancials": {
      if (!isRecord(result)) {
        return { title: "Analyzed financials", detail: "Cashflow review complete", icon: DollarSign };
      }
      const summary = isRecord(result.summary) ? result.summary : {};
      const currency = typeof result.currency === "string" ? result.currency : "USD";
      const milestones = result.milestonesCount;
      const collected = summary.collected;
      const overdue = summary.overdue;
      const parts: string[] = [];
      if (typeof milestones === "number") parts.push(`${milestones} milestone${milestones === 1 ? "" : "s"}`);
      if (typeof collected === "number") parts.push(`${collected} ${currency} collected`);
      if (typeof overdue === "number" && overdue > 0) parts.push(`${overdue} ${currency} overdue`);
      return {
        title: "Analyzed financials",
        detail: parts.length ? parts.join(" · ") : "No payment milestones found",
        icon: DollarSign,
      };
    }

    case "generateClientDigest": {
      if (!isRecord(result)) {
        return { title: "Compiled client digest", detail: "Progress update ready", icon: Newspaper };
      }
      if (typeof result.error === "string") {
        return { title: "Compiled client digest", detail: result.error, icon: Newspaper };
      }
      const ds = isRecord(result.deliverablesSummary) ? result.deliverablesSummary : {};
      const parts: string[] = [];
      if (typeof result.projectName === "string") parts.push(result.projectName);
      if (typeof ds.approvedCount === "number") parts.push(`${ds.approvedCount} approved`);
      if (typeof ds.inReviewCount === "number" && ds.inReviewCount > 0) {
        parts.push(`${ds.inReviewCount} in review`);
      }
      return {
        title: "Compiled client digest",
        detail: parts.length ? parts.join(" · ") : "No deliverable activity yet",
        icon: Newspaper,
      };
    }

    case "createDeliverableDraft": {
      if (!isRecord(result)) {
        return { title: "Drafted deliverable", detail: "Awaiting your approval", icon: PackagePlus };
      }
      if (typeof result.error === "string") {
        return { title: "Drafted deliverable", detail: result.error, icon: PackagePlus };
      }
      const draft = isRecord(result.draft) ? result.draft : {};
      const title = typeof draft.title === "string" ? draft.title : undefined;
      const projectName = typeof result.projectName === "string" ? result.projectName : undefined;
      const parts: string[] = [];
      if (title) parts.push(title);
      if (projectName) parts.push(`for ${projectName}`);
      return {
        title: "Drafted new deliverable",
        detail: parts.length ? `${parts.join(" ")} · awaiting approval` : "Awaiting your approval",
        icon: PackagePlus,
      };
    }

    default: {
      const formattedName = toolName
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      return {
        title: `Ran ${formattedName}`,
        detail: "Completed",
        icon: Wrench,
      };
    }
  }
}

interface TimelineStep {
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  status: ToolCallStep["status"];
}

/**
 * Minimum visible duration (ms) for each step before it may transition from
 * active → complete. A tool that resolves in 50ms still lingers long enough to
 * read, preventing a flash of unreadable content on fast local queries. This
 * floor carries forward from prior sessions onto the new AgentActivity timeline.
 */
const MIN_VISIBLE_MS = 400;

/**
 * Holds any "complete" step at "active" until it has been visible for at
 * least `minMs`. Carries the prior-session 400ms floor onto the new timeline.
 */
function useMinVisibleSteps(
  steps: TimelineStep[],
  minMs: number,
): TimelineStep[] {
  const firstSeenRef = React.useRef<Map<string, number>>(new Map());
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  React.useEffect(() => {
    const now = Date.now();
    const ts = firstSeenRef.current;
    let earliestRetry = Infinity;

    for (const step of steps) {
      if (!ts.has(step.id)) {
        ts.set(step.id, now);
      }
      const firstSeen = ts.get(step.id)!;
      const elapsed = now - firstSeen;
      if (step.status === "complete" && elapsed < minMs) {
        earliestRetry = Math.min(earliestRetry, minMs - elapsed);
      }
    }

    if (earliestRetry !== Infinity && earliestRetry > 0) {
      const timer = setTimeout(() => forceUpdate(), earliestRetry + 10);
      return () => clearTimeout(timer);
    }
  }, [steps, minMs]);

  const now = Date.now();
  return steps.map((step) => {
    const firstSeen = firstSeenRef.current.get(step.id) ?? now;
    if (step.status === "complete" && now - firstSeen < minMs) {
      return { ...step, status: "calling" as const };
    }
    return step;
  });
}

export function TorchReasoning({ toolCalls }: TorchReasoningProps) {
  const hasTools = toolCalls && toolCalls.length > 0;
  const allComplete = hasTools
    ? toolCalls.every((tc) => tc.status === "complete" || tc.status === "error")
    : false;

  const steps: TimelineStep[] = React.useMemo(() => {
    if (!hasTools) return [];
    return toolCalls.map((tc, index) => {
      const formatted = formatToolStep(tc.toolName, tc.result);
      return {
        id: `step-${index}-${tc.toolCallId ?? tc.toolName}`,
        title: formatted.title,
        detail: tc.status === "error" && !tc.result ? "Failed to complete" : formatted.detail,
        icon: formatted.icon,
        status: tc.status,
      };
    });
  }, [toolCalls, hasTools]);

  // Apply the 400ms minimum-visible floor before rendering.
  const visibleSteps = useMinVisibleSteps(steps, MIN_VISIBLE_MS);
  const working = !allComplete && visibleSteps.some((s) => s.status === "calling");

  if (!hasTools || visibleSteps.length === 0) return null;

  return (
    <div
      data-state={working ? "working" : "complete"}
      aria-busy={working}
      className="w-full text-sm"
    >
      {working ? (
        <div role="status" className="mb-2 flex h-7 min-w-0 items-center text-muted-foreground">
          <ThinkingShimmer>Torch is working…</ThinkingShimmer>
        </div>
      ) : (
        <div className="mb-1 flex h-7 min-w-0 items-center text-[13px] font-medium text-muted-foreground">
          Ran {visibleSteps.length} {visibleSteps.length === 1 ? "tool" : "tools"}
        </div>
      )}

      {/*
        Always expanded — collapseOnComplete is intentionally false so the
        step sequence stays visible instead of collapsing into a summary.
        The AgentDisclosure below never closes (open={true}).
      */}
      <AgentDisclosure open className="text-foreground">
        <div className="relative">
          {/*
            Dashed vertical connector running behind each row's icon. It sits
            in the icon column (left), spanning between rows. Each row keeps its
            own icon in a small rounded container to its left, matching the
            reference image's visual language.
          */}
          <ol className="relative ml-0.5 space-y-1">
            {visibleSteps.map((step, idx) => {
              const isActive = step.status === "calling";
              const isError = step.status === "error";
              const isLast = idx === visibleSteps.length - 1;
              const StepIcon = step.icon;

              return (
                <motion.li
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    duration: 0.35,
                    bounce: 0,
                    delay: Math.min(idx * 0.04, 0.16),
                  }}
                  className="relative flex gap-3"
                >
                  {/* Icon + vertical dashed connector column */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                        isError
                          ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
                          : isActive
                            ? "border-brand/30 bg-brand/5 text-brand"
                            : "border-border/50 bg-muted text-muted-foreground",
                      )}
                    >
                      <StepIcon
                        className={cn(
                          "h-3.5 w-3.5",
                          isActive && "animate-spin",
                        )}
                      />
                    </div>
                    {/* Dashed connector to the next row — not rendered on last row */}
                    {!isLast && (
                      <div
                        aria-hidden="true"
                        className="absolute top-7 bottom-0 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-border/50"
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-3")}>
                    {isActive ? (
                      <ThinkingShimmer duration={1.5} className="text-sm">
                        {step.title}…
                      </ThinkingShimmer>
                    ) : (
                      <div className="text-sm font-medium leading-snug text-foreground">
                        {step.title}
                      </div>
                    )}
                    {step.detail && !isActive && (
                      <div className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        {step.detail}
                      </div>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </AgentDisclosure>
    </div>
  );
}
