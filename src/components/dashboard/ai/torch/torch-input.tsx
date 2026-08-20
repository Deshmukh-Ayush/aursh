"use client";

import * as React from "react";
import { useTorch } from "./torch-context";
import { LexicalAIInput } from "../lexical-ai-input";
import { Suggestion } from "@/components/ai-elements/suggestion";

export interface TorchInputProps {
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Analyze revenue velocity & pipeline bottlenecks",
  "/audit-scope on pending deliverables",
  "/draft-addendum for extra client revision rounds",
  "/cashflow breakdown across milestones",
  "Summarize active deliverable review statuses",
];

export function TorchInput({ suggestions = DEFAULT_SUGGESTIONS }: TorchInputProps) {
  const { sendMessage, loading, projects } = useTorch();

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {suggestions.map((sug, i) => (
          <Suggestion
            key={i}
            suggestion={sug}
            onClick={() => sendMessage(sug)}
            className="text-[11px] whitespace-nowrap shrink-0 hover:border-brand/40"
          >
            {sug}
          </Suggestion>
        ))}
      </div>

      <LexicalAIInput
        onSend={sendMessage}
        disabled={loading}
        projects={projects}
      />
    </div>
  );
}
