"use client";

import * as React from "react";
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
import { ScrunityAIChainOfThought, ReasoningStep } from "../scrunity-ai-chain-of-thought";

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

export function TorchReasoning({ toolCalls }: TorchReasoningProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const steps: ReasoningStep[] = toolCalls.map((tc, index) => {
    const formatted = formatToolStep(tc.toolName, tc.result);
    const isStepError = tc.status === "error";

    return {
      id: `step-${index}`,
      title: formatted.title,
      detail: isStepError && !tc.result ? "Failed to complete" : formatted.detail,
      icon: formatted.icon,
      status: tc.status === "complete" ? ("complete" as const) : ("active" as const),
    };
  });

  return <ScrunityAIChainOfThought steps={steps} />;
}
