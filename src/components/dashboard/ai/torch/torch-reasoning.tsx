"use client";

import * as React from "react";
import { ToolCallStep } from "./torch-context";
import { ScrunityAIChainOfThought, ReasoningStep } from "../scrunity-ai-chain-of-thought";

export interface TorchReasoningProps {
  toolCalls?: ToolCallStep[];
}

export function TorchReasoning({ toolCalls }: TorchReasoningProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const steps: ReasoningStep[] = toolCalls.map((tc, index) => {
    const formattedName = tc.toolName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

    return {
      id: `step-${index}`,
      title: `Executing ${formattedName}`,
      detail: tc.result
        ? JSON.stringify(tc.result).slice(0, 160) + (JSON.stringify(tc.result).length > 160 ? "..." : "")
        : "Running workspace agent tool...",
      status: tc.status === "complete" ? "complete" : "running",
    };
  });

  return <ScrunityAIChainOfThought steps={steps} />;
}
