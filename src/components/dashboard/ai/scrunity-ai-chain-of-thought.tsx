"use client"

import * as React from "react"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtContent,
} from "@/components/ai-elements/chain-of-thought"
import { Database, FileSearch, CheckCircle2, Brain } from "lucide-react"

export interface ReasoningStep {
  id: string
  title: string
  detail: string
  status: "complete" | "active" | "pending"
}

interface ScrunityAIChainOfThoughtProps {
  isStreaming?: boolean
  steps: ReasoningStep[]
}

export function ScrunityAIChainOfThought({
  isStreaming = false,
  steps,
}: ScrunityAIChainOfThoughtProps) {
  return (
    <ChainOfThought defaultOpen={false} className="mb-3 rounded-lg border border-border/30 bg-muted/30 p-2.5">
      <ChainOfThoughtHeader className="cursor-pointer font-medium text-xs text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Reasoning ({steps.length} steps)</span>
        </span>
      </ChainOfThoughtHeader>

      <ChainOfThoughtContent className="mt-2.5 space-y-2 pt-2 border-t border-border/20">
        {steps.map((step, idx) => (
          <ChainOfThoughtStep
            key={step.id || idx}
            icon={
              idx === 0 ? (
                Database
              ) : idx === 1 ? (
                FileSearch
              ) : (
                CheckCircle2
              )
            }
            label={step.title}
            description={step.detail}
            status={step.status}
          />
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}
