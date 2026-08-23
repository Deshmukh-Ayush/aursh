"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  ChainOfThoughtContent,
} from "@/components/ai-elements/chain-of-thought"
import { Brain, CheckCircle2, type LucideIcon } from "lucide-react"

export interface ReasoningStep {
  id: string
  title: string
  detail: string
  status: "complete" | "active" | "pending"
  icon?: LucideIcon
}

interface ScrunityAIChainOfThoughtProps {
  isStreaming?: boolean
  steps: ReasoningStep[]
}

/**
 * Wraps the base ChainOfThought with real motion so steps feel like live
 * progress rather than an instant snap: each step springs in with a small
 * stagger as it arrives, and `layout` smooths reflow when new steps push
 * existing ones down. No artificial delays — motion reflects real,
 * already-arriving stream events.
 */
export function ScrunityAIChainOfThought({
  isStreaming = false,
  steps,
}: ScrunityAIChainOfThoughtProps) {
  return (
    <ChainOfThought defaultOpen={false} className="mb-3 rounded-lg border border-border/30 bg-muted/30 p-2.5">
      <ChainOfThoughtHeader className="cursor-pointer font-medium text-xs text-muted-foreground hover:text-foreground">
        <span className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Reasoning ({steps.length} step{steps.length === 1 ? "" : "s"})</span>
        </span>
      </ChainOfThoughtHeader>

      <ChainOfThoughtContent className="mt-2.5 space-y-0 pt-2 border-t border-border/20">
        {steps.map((step, idx) => {
          const StepIcon = step.icon ?? (idx === steps.length - 1 ? CheckCircle2 : Brain)
          return (
            <motion.div
              key={step.id || idx}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0, delay: Math.min(idx * 0.04, 0.16) }}
            >
              <ChainOfThoughtStep
                icon={StepIcon}
                label={step.title}
                description={step.detail}
                status={step.status}
              />
            </motion.div>
          )
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}
