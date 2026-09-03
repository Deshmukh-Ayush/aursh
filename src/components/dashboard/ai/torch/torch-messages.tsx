"use client";

import React, { useEffect } from "react";
import { useTorch, WorkspaceSummary } from "./torch-context";
import { User, Copy, Check, Sparkles, Plus } from "lucide-react";
import Image from "next/image";
import { TorchReasoning } from "./torch-reasoning";
import { TorchArtifact } from "./torch-artifact";
import { TorchToolResults } from "./results/torch-tool-results";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@/components/agents/message";
import { MessageBubble, MessageBubbleContent } from "@/components/agents/message-bubble";
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
  const { orgName, userName, sendMessage, loading } = useTorch();
  const suggestions = buildSuggestions(summary);
  const displayName = userName || orgName || "there";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted border border-border/40">
            <Image
              src="/logo/scrunity_logo_svg.svg"
              alt="Torch"
              width={28}
              height={28}
              className="h-7 w-7 object-contain dark:invert"
            />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Good to see you, {displayName}
          </h2>
          <p className="text-base text-muted-foreground max-w-sm mx-auto">
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
              <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              <span className="text-base text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TorchMessages() {
  const {
    messages,
    loading,
    initialLoading,
    startNewConversation,
    workspaceSummary,
    copiedId,
    copyMessage,
  } = useTorch();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (initialLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 space-y-3">
        <Image
          src="/logo/scrunity_logo_svg.svg"
          alt="Torch loading"
          width={28}
          height={28}
          className="animate-pulse dark:invert opacity-70"
        />
        <span className="text-xs text-muted-foreground">Resuming conversation…</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return <TorchEmptyState summary={workspaceSummary} />;
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex justify-end items-center px-2 pb-2">
        <button
          onClick={startNewConversation}
          disabled={loading}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-lg bg-background/80 hover:bg-muted transition-all disabled:opacity-50"
          title="Start a new conversation"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>
      </div>
      <MessageGroup spacing="default" className="px-1 pb-4">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        if (isUser) {
          return (
            <Message key={msg.id} from="user" animateIn>
              <MessageAvatar className="bg-muted border border-border/40">
                <User className="h-4 w-4 text-muted-foreground" />
              </MessageAvatar>
              <MessageContent>
                <MessageBubble variant="ghost" align="end" animateIn>
                  <MessageBubbleContent className="max-w-[80%] rounded-2xl bg-brand px-4 py-2.5 text-base font-medium leading-relaxed text-white shadow-xs">
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </MessageBubbleContent>
                </MessageBubble>
                <span className="px-1 text-[13px] tabular-nums text-muted-foreground opacity-70">
                  {msg.createdAt}
                </span>
              </MessageContent>
            </Message>
          );
        }

        return (
          <Message key={msg.id} from="assistant" animateIn>
            <MessageAvatar className="bg-muted border border-border/40">
              <Image
                src="/logo/scrunity_logo_svg.svg"
                alt="Torch"
                width={20}
                height={20}
                className="h-5 w-5 object-contain dark:invert"
              />
            </MessageAvatar>
            <MessageContent>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <TorchReasoning toolCalls={msg.toolCalls} />
              )}

              <TorchToolResults toolCalls={msg.toolCalls} />

              {msg.content && (
                <MessageBubble variant="ghost" align="start">
                  <MessageBubbleContent className="text-base leading-7 text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_table]:my-2 [&_th]:px-2 [&_td]:px-2 [&_pre]:my-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm">
                    <MessageResponse>{msg.content}</MessageResponse>
                  </MessageBubbleContent>
                </MessageBubble>
              )}

              {msg.artifact && <TorchArtifact message={msg} />}

              <div className="flex items-center gap-3 px-1 pt-1 text-[13px] text-muted-foreground">
                <span className="tabular-nums">{msg.createdAt}</span>
                {msg.content && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </MessageContent>
          </Message>
        );
      })}

      {loading && (
        <div className="flex items-center gap-2.5 pl-9 text-base text-muted-foreground">
          <Image
            src="/logo/scrunity_logo_svg.svg"
            alt="Torch is working"
            width={20}
            height={20}
            className="h-5 w-5 object-contain dark:invert animate-pulse"
          />
          <span>Torch is reasoning workspace insights…</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </MessageGroup>
    </div>
  );
}
