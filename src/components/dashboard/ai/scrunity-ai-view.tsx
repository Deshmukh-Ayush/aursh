"use client"

import * as React from "react"
import { Bot, User, Copy, Check, Brain } from "lucide-react"
import { LexicalAIInput, LexicalProjectOption } from "./lexical-ai-input"
import { ScrunityAIChainOfThought, ReasoningStep } from "./scrunity-ai-chain-of-thought"
import { Suggestion } from "@/components/ai-elements/suggestion"
import { toast } from "sonner"

export interface MessageItem {
  id: string
  role: "user" | "assistant"
  content: string
  reasoningSteps?: ReasoningStep[]
  createdAt: string
}

export interface WorkspaceSummary {
  orgName: string
  plan: string
  activeProjectsCount: number
  totalProjectsCount: number
  inReviewDeliverablesCount: number
  totalProposalValue: number
  projects: LexicalProjectOption[]
}

interface ScrunityAIViewProps {
  orgName: string
  projects: LexicalProjectOption[]
  workspaceSummary?: WorkspaceSummary
}

const QUICK_SUGGESTIONS = [
  "Analyze revenue velocity & pipeline bottlenecks",
  "Draft proposal SOW for pending client",
  "Summarize active deliverable review statuses",
  "Audit contract compliance & scope risks",
]

export function ScrunityAIView({ orgName, projects, workspaceSummary }: ScrunityAIViewProps) {
  const [messages, setMessages] = React.useState<MessageItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const nextMessageIdRef = React.useRef(0)

  const createMessageId = React.useCallback((prefix: string) => {
    nextMessageIdRef.current += 1
    return `${prefix}-${nextMessageIdRef.current}`
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, loading])

  const handleSend = async (promptText: string) => {
    if (!promptText.trim() || loading) return

    const userMessage: MessageItem = {
      id: createMessageId("usr"),
      role: "user",
      content: promptText,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    const sampleSteps: ReasoningStep[] = [
      {
        id: "step-1",
        title: "Querying Workspace System Context",
        detail: `Retrieved live database snapshot for ${orgName} (${projects.length} linked projects).`,
        status: "complete",
      },
      {
        id: "step-2",
        title: "Analyzing Deliverables & Contract Volume",
        detail: "Evaluated contract compliance, milestone payments, and deliverables currently in review.",
        status: "complete",
      },
      {
        id: "step-3",
        title: "Synthesizing Executive Recommendation",
        detail: "Constructed direct executive recommendations.",
        status: "complete",
      },
    ]

    setTimeout(() => {
      let aiResponseContent = ""

      if (promptText.includes("/summarize")) {
        aiResponseContent = `Executive Summary for **${orgName}**:\n\n- Active Projects: ${projects.length} workspace projects operating on schedule.\n- Deliverable Health: All milestones are progressing on schedule.\n- Immediate Action: ${workspaceSummary?.inReviewDeliverablesCount || 2} deliverables currently in review awaiting client sign-off.`
      } else if (promptText.includes("/analyze-revenue")) {
        aiResponseContent = `Revenue & Pipeline Velocity Analysis:\n\n- Won Revenue: ₹${(workspaceSummary?.totalProposalValue || 850000).toLocaleString("en-IN")}\n- Active Pipeline: ₹3,40,000 pending client approval.\n- Recommendation: Follow up on pending proposals for peak conversion rate.`
      } else if (promptText.includes("/review-deliverables")) {
        aiResponseContent = `Deliverable Review Audit:\n\n- In Review: ${workspaceSummary?.inReviewDeliverablesCount || 3} deliverables awaiting client inspection.\n- Revisions: 0 blocked revision requests.\n- Status: All milestone deadlines are on schedule.`
      } else {
        aiResponseContent = `Based on live workspace data for **${orgName}**:\n\n1. Project Execution: All ${projects.length} active projects (${projects.map((p) => p.name).join(", ")}) have active contracts.\n2. Workspace Pace: High execution velocity across deliverables and milestone payments.\n\nLet me know if you would like me to draft a proposal or generate a project audit!`
      }

      const aiMessage: MessageItem = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiResponseContent,
        reasoningSteps: sampleSteps,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, aiMessage])
      setLoading(false)
    }, 1100)
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">How can I assist your workspace today?</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Ask about active projects in <strong>{orgName}</strong>, contract compliance, deliverable reviews, or revenue pipeline. Type <code className="font-mono text-brand font-semibold">/</code> for commands or <code className="font-mono text-brand font-semibold">@</code> to target a project.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border/40 text-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`flex max-w-[80%] flex-col gap-1.5 rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand text-white font-medium"
                    : "bg-muted/40 border border-border/40 text-foreground"
                }`}
              >
                {msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                  <ScrunityAIChainOfThought steps={msg.reasoningSteps} />
                )}

                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.content}
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] opacity-60">
                  <span className="tabular-nums">{msg.createdAt}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 hover:opacity-100 transition-opacity"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground animate-pulse p-2">
              <Brain className="h-3.5 w-3.5 text-brand animate-spin" />
              <span>Reasoning workspace insights...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {QUICK_SUGGESTIONS.map((sug, i) => (
          <Suggestion
            key={i}
            suggestion={sug}
            onClick={() => handleSend(sug)}
            className="text-[11px] whitespace-nowrap shrink-0 hover:border-brand/40"
          >
            {sug}
          </Suggestion>
        ))}
      </div>

      <LexicalAIInput onSend={handleSend} disabled={loading} projects={projects} />
    </div>
  )
}