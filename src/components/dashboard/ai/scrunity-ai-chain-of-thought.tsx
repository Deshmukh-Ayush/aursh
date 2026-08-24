"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Steps, StepsBar } from "@/components/ui/steps"
import { Tool, type ToolPart } from "@/components/ui/tool"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type StepKind =
  | "reasoning"
  | "tool-active"
  | "tool-complete"
  | "artifact"
  | "error"

export interface ReasoningStep {
  id: string
  title: string
  detail: string
  status: "complete" | "active" | "pending"
  icon?: LucideIcon
  kind?: StepKind
  /** prompt-kit ToolPart data for the Tool primitive */
  toolPart?: ToolPart
  /** Human-readable summary line shown under the step title */
  summary?: string
}

interface ScrunityAIChainOfThoughtProps {
  isStreaming?: boolean
  steps: ReasoningStep[]
}

/**
 * Minimum visible duration (ms) for each step before it may transition to its
 * next state. This is a *floor* on real events' visibility — if a tool call
 * resolves in 50ms the step still lingers long enough to read, preventing a
 * flash of unreadable content on fast local queries. It does NOT add any delay
 * to steps that have no real content behind them.
 */
const MIN_VISIBLE_MS = 400

/**
 * Delays the visual transition of a step from "active" → "complete" by at
 * least `minMs` from when the step first appeared. Steps that are already
 * "complete" but haven't been visible for the minimum duration are held at
 * "active" until the timer fires, then the component re-readers naturally.
 */
function useMinVisibleSteps(
  steps: ReasoningStep[],
  minMs: number,
): ReasoningStep[] {
  const firstSeenRef = React.useRef<Map<string, number>>(new Map())
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0)

  React.useEffect(() => {
    const now = Date.now()
    const ts = firstSeenRef.current
    let earliestRetry = Infinity

    for (const step of steps) {
      if (!ts.has(step.id)) {
        ts.set(step.id, now)
      }
      const firstSeen = ts.get(step.id)!
      const elapsed = now - firstSeen
      if (step.status === "complete" && elapsed < minMs) {
        earliestRetry = Math.min(earliestRetry, minMs - elapsed)
      }
    }

    if (earliestRetry !== Infinity && earliestRetry > 0) {
      const timer = setTimeout(forceUpdate, earliestRetry + 10)
      return () => clearTimeout(timer)
    }
  }, [steps, minMs])

  const now = Date.now()
  return steps.map((step) => {
    const firstSeen = firstSeenRef.current.get(step.id) ?? now
    if (step.status === "complete" && now - firstSeen < minMs) {
      return { ...step, status: "active" as const }
    }
    return step
  })
}

/**
 * Step-by-step tool-call timeline built on prompt-kit's Steps + Tool + Text
 * Shimmer primitives. Each tool call renders as a collapsible step with a
 * per-tool icon, a shimmering loader while active, and the prompt-kit Tool
 * primitive's built-in input/output/status display when expanded. A minimum
 * visible duration floor prevents fast-resolving steps from flashing by.
 */
export function ScrunityAIChainOfThought({
  isStreaming = false,
  steps,
}: ScrunityAIChainOfThoughtProps) {
  const visibleSteps = useMinVisibleSteps(steps, MIN_VISIBLE_MS)

  if (visibleSteps.length === 0) return null

  return (
    <Steps defaultOpen className="mb-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span>
          {isStreaming ? "Working" : "Steps"} ({visibleSteps.length}
          {visibleSteps.length === 1 ? " step" : " steps"})
        </span>
      </div>

      <div className="relative ml-0.5">
        {visibleSteps.map((step, idx) => {
          const isActive = step.status === "active"
          const isLast = idx === visibleSteps.length - 1
          const StepIcon = step.icon

          return (
            <motion.div
              key={step.id || idx}
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
              {/* Icon + vertical connector */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                    step.kind === "error"
                      ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
                      : isActive
                        ? "border-brand/30 bg-brand/5 text-brand"
                        : "border-border/50 bg-muted text-muted-foreground",
                  )}
                >
                  {StepIcon && (
                    <StepIcon
                      className={cn(
                        "h-3.5 w-3.5",
                        step.kind === "tool-active" && "animate-spin",
                      )}
                    />
                  )}
                </div>
                {!isLast && <StepsBar className="h-full" />}
              </div>

              {/* Step content */}
              <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-4")}>
                {isActive ? (
                  <TextShimmer duration={1.5} className="text-sm">
                    {step.title}…
                  </TextShimmer>
                ) : (
                  <div className="text-sm font-medium leading-snug text-foreground">
                    {step.title}
                  </div>
                )}
                {step.detail && !isActive && (
                  <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {step.detail}
                  </div>
                )}
                {step.toolPart && (
                  <Tool
                    toolPart={step.toolPart}
                    defaultOpen={false}
                    className="mt-2"
                  />
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </Steps>
  )
}
