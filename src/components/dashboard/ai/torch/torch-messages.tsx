"use client";

import React, { useEffect } from "react";
import { useTorch } from "./torch-context";
import { Flame, User, Copy, Check, Brain } from "lucide-react";
import { TorchReasoning } from "./torch-reasoning";
import { TorchArtifact } from "./torch-artifact";
import { cn } from "@/lib/utils";

export function TorchMessages() {
  const { messages, loading, orgName, copiedId, copyMessage } = useTorch();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center p-6 space-y-3">
        <div>
          <h2 className="text-2xl font-medium text-neutral-800">
            Hi User
          </h2>
          <p>Want me to list all the clients?</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 custom-scrollbar">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex items-start gap-3",
            msg.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          {msg.role === "assistant" && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/40 text-brand">
              <Flame className="h-3.5 w-3.5" />
            </div>
          )}

          <div
            className={cn(
              "flex max-w-[85%] flex-col gap-1.5 rounded-xl px-4 py-3 text-xs leading-relaxed",
              msg.role === "user"
                ? "bg-brand text-white font-medium shadow-xs"
                : "bg-muted/30 border border-border/40 text-foreground",
            )}
          >
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <TorchReasoning toolCalls={msg.toolCalls} />
            )}

            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
              {msg.content}
            </div>

            {msg.artifact && <TorchArtifact message={msg} />}

            <div className="flex items-center justify-between pt-1 text-[10px] opacity-60">
              <span className="tabular-nums">{msg.createdAt}</span>
              {msg.role === "assistant" && msg.content && (
                <button
                  onClick={() => copyMessage(msg.id, msg.content)}
                  className="inline-flex items-center gap-1 hover:opacity-100 transition-opacity"
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

          {msg.role === "user" && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-xs">
              <User className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground animate-pulse p-2">
          <Brain className="h-3.5 w-3.5 text-brand animate-spin" />
          <span>Torch is reasoning workspace insights...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
