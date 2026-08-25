"use client";

import * as React from "react";
import { ToolCallStep } from "../torch-context";
import { WorkspaceOverviewResult } from "./workspace-overview-result";
import { FinancialsResult } from "./financials-result";
import { ClientDigestResult } from "./client-digest-result";
import { ScopeAuditResult } from "./scope-audit-result";

/**
 * Renders the structured, read-only results of Torch's query-type tools.
 *
 * The four informational query tools each have a purpose-built result component
 * (real tables / summary cards — unchanged) that already renders its own
 * bordered card UI with humanized enum status text. These render directly as
 * the tool-result body; they don't need beUI's `ToolResult` wrapper because
 * `ToolResult` hardcodes an inner `bg-muted/80` rounded container that would
 * double-frame cards which already carry their own `border bg-background`
 * styling. The reasoning timeline in `torch-reasoning.tsx` (built on beUI
 * `AgentActivity` / `AgentDisclosure`) already provides the per-tool status
 * disclosure and icon; these result cards are the *content* that appears once
 * a query step completes.
 *
 * Only the four informational query tools render here. The two drafting tools
 * (`generateAddendumDraft`, `createDeliverableDraft`) return actionable
 * artifacts handled separately by `torch-artifact.tsx`.
 */
const RESULT_RENDERERS: Record<
  string,
  React.ComponentType<{ result: unknown }>
> = {
  queryWorkspaceOverview: WorkspaceOverviewResult,
  analyzeFinancials: FinancialsResult,
  generateClientDigest: ClientDigestResult,
  auditProjectScope: ScopeAuditResult,
};

export interface TorchToolResultsProps {
  toolCalls?: ToolCallStep[];
}

export function TorchToolResults({ toolCalls }: TorchToolResultsProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const rendered: {
    key: string;
    Renderer: React.ComponentType<{ result: unknown }>;
    result: unknown;
  }[] = [];

  for (const tc of toolCalls) {
    // Only render a structured result once the tool has returned data and
    // wasn't an error; calling / errored steps have no payload to show.
    if (tc.status !== "complete" || tc.result == null) continue;
    const Renderer = RESULT_RENDERERS[tc.toolName];
    if (!Renderer) continue;
    rendered.push({
      key: tc.toolName + (tc.toolCallId ?? ""),
      Renderer,
      result: tc.result,
    });
  }

  if (rendered.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {rendered.map(({ key, Renderer, result }) => (
        <Renderer key={key} result={result} />
      ))}
    </div>
  );
}
