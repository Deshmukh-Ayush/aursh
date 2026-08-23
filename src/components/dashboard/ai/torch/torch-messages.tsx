"use client";

import React, { useEffect } from "react";
import { useTorch, WorkspaceSummary } from "./torch-context";
import { Flame, User, Copy, Check, Brain, Sparkles } from "lucide-react";
import { TorchReasoning } from "./torch-reasoning";
import { TorchArtifact } from "./torch-artifact";
import { cn } from "@/lib/utils";

interface SuggestedPrompt {
  label: string;
  prompt: string;
}

/**
 * Builds 2-4 real, data-derived suggested prompts from the workspace summary.
 * Empty workspaces get a different set than ones with projects — the first
 * impression reflects what Torch actually sees, not a hardcoded string.
 */
function buildSuggestions(summary?: WorkspaceSummary): SuggestedPrompt[] {
  if (!summary) {
    return [
      {
        label: "Summarize my workspace",
        prompt: "Give me an overview of my workspace — projects, deliverables, and financials.",
      },
    ];
  }

  const suggestions: SuggestedPrompt[] = [];

  if (summary.inReviewDeliverablesCount > 0) {
    suggestions.push({
      label: `Review ${summary.inReviewDeliverablesCount} deliverable${summary.inReviewDeliverablesCount === 1 ? "" : "s"} in review`,
      prompt: "Show me what's in review across my projects and what needs attention.",
    });
  }

  if (summary.totalProjectsCount > 0) {
    const firstProject = summary.projects[0];
    suggestions.push({
      label: `Audit scope on ${firstProject.name}`,
      prompt: `Audit the scope and revision history on @${firstProject.name}.`,
    });
  }

  if (summary.totalProposalValue > 0) {
    suggestions.push({
      label: "Analyze collected revenue",
      prompt: "Analyze my collected revenue, outstanding cashflow, and overdue milestones.",
    });
  } else if (summary.activeProjectsCount > 0) {
    suggestions.push({
      label: "Compile a client update",
      prompt: `Compile a weekly client progress digest for @${summary.projects[0].name}.`,
    });
  }

  if (suggestions.length < 2) {
    suggestions.push({
      label: "What can you do?",
      prompt: "What can you help me with across my projects and financials?",
    });
  }

  return suggestions.slice(0, 4);
}

function TorchEmptyState({ summary }: { summary?: WorkspaceSummary }) {
  const { orgName, sendMessage, loading } = useTorch();
  const suggestions = buildSuggestions(summary);
  const displayName = orgName || "there";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Flame className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Good to see you, {displayName}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Torch has eyes on your workspace. Ask anything, or start with one of these.
          </p>
        </div>

        <div className="flex flex-col gap-2 items-stretch">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={loading}
              onClick={() => sendMessage(s.prompt)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-left transition-colors",
                "hover:border-border hover:bg-muted/40 disabled:opacity-50",
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
              <span className="text-sm text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TorchMessages() {
  const { messages, loading, workspaceSummary, copiedId, copyMessage } = useTorch();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (messages.length === 0) {
    return <TorchEmptyState summary={workspaceSummary} />;
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-8 px-1 pr-2 custom-scrollbar">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        if (isUser) {
          return (
            <div key={msg.id} className="flex items-start justify-end gap-3">
              <div className="flex max-w-[80%] flex-col gap-1.5 rounded-2xl bg-brand px-4 py-2.5 text-sm leading-relaxed text-white font-medium shadow-xs">
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <span className="text-[10px] tabular-nums opacity-70">{msg.createdAt}</span>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand border border-border/40">
                <User className="h-4 w-4" />
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/40 text-brand">
              <Flame className="h-4 w-4" />
            </div>

            <div className="flex flex-1 flex-col gap-3 min-w-0">
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <TorchReasoning toolCalls={msg.toolCalls} />
              )}

              {msg.content && (
                <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                  {msg.content}
                </div>
              )}

              {msg.artifact && (
                <div className="max-w-lg">
                  <TorchArtifact message={msg} />
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                <span className="tabular-nums">{msg.createdAt}</span>
                {msg.content && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    title="Copy message"
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
          </div>
        );
      })}

      {loading && (
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground animate-pulse pl-11">
          <Brain className="h-4 w-4 text-brand animate-spin" />
          <span>Torch is reasoning workspace insights...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
