"use client";

import * as React from "react";
import { LexicalProjectOption } from "../lexical-ai-input";
import { toast } from "sonner";

export type JsonObject = Record<string, unknown>;

export interface AddendumLineItem {
  description: string;
  amount: number;
}

export interface ChangeOrderAddendum {
  title: string;
  summary: string;
  additionalPrice: number;
  currency: string;
  lineItems: AddendumLineItem[];
}

export interface DeliverableDraft {
  title: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface ChangeOrderArtifactData {
  projectId: string;
  addendum: ChangeOrderAddendum;
}

export interface CreateDeliverableArtifactData {
  projectId: string;
  projectName: string;
  draft: DeliverableDraft;
}

export type TorchArtifact =
  | {
      type: "change_order_addendum";
      data: ChangeOrderArtifactData;
      status: "pending" | "approved" | "rejected";
    }
  | {
      type: "create_deliverable_confirmation";
      data: CreateDeliverableArtifactData;
      status: "pending" | "approved" | "rejected";
    };

export interface CreateDeliverablePayload {
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface CreateAddendumProposalPayload {
  projectId: string;
  addendum: ChangeOrderAddendum;
}

export type ArtifactAction = "create_deliverable" | "create_addendum_proposal";
export type ArtifactConfirmationPayload =
  | CreateDeliverablePayload
  | CreateAddendumProposalPayload;

interface ConfirmationResponse {
  success?: boolean;
  error?: string;
}

export interface ToolCallStep {
  toolName: string;
  args?: JsonObject;
  result?: unknown;
  status: "calling" | "complete" | "error";
}

export interface TorchMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCallStep[];
  artifact?: TorchArtifact;
  createdAt: string;
}

export interface WorkspaceSummary {
  orgName: string;
  plan: string;
  activeProjectsCount: number;
  totalProjectsCount: number;
  inReviewDeliverablesCount: number;
  totalProposalValue: number;
  projects: LexicalProjectOption[];
}

export interface TorchContextValue {
  messages: TorchMessage[];
  loading: boolean;
  orgName: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
  sendMessage: (content: string) => Promise<void>;
  confirmArtifact: (
    messageId: string,
    actionType: ArtifactAction,
    payload: ArtifactConfirmationPayload,
  ) => Promise<void>;
  rejectArtifact: (messageId: string) => void;
  copiedId: string | null;
  copyMessage: (id: string, text: string) => Promise<void>;
}

const TorchContext = React.createContext<TorchContextValue | null>(null);

export function useTorch() {
  const context = React.useContext(TorchContext);
  if (!context) {
    throw new Error("useTorch must be used within a <Torch.Root> provider");
  }
  return context;
}

interface TorchProviderProps {
  children: React.ReactNode;
  orgName: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
}

export function TorchProvider({
  children,
  orgName,
  projects,
  workspaceSummary,
}: TorchProviderProps) {
  const [messages, setMessages] = React.useState<TorchMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const isRecord = (value: unknown): value is JsonObject =>
    typeof value === "object" && value !== null;

  const isArtifactResult = (
    value: unknown,
  ): value is
    | ({ artifactType: "change_order_addendum" } & ChangeOrderArtifactData)
    | ({ artifactType: "create_deliverable_confirmation" } & CreateDeliverableArtifactData) => {
    if (!isRecord(value) || value.requiresConfirmation !== true) return false;

    if (value.artifactType === "change_order_addendum") {
      return (
        typeof value.projectId === "string" &&
        isRecord(value.addendum) &&
        typeof value.addendum.title === "string" &&
        typeof value.addendum.summary === "string" &&
        typeof value.addendum.additionalPrice === "number" &&
        typeof value.addendum.currency === "string" &&
        Array.isArray(value.addendum.lineItems)
      );
    }

    return (
      value.artifactType === "create_deliverable_confirmation" &&
      typeof value.projectId === "string" &&
      typeof value.projectName === "string" &&
      isRecord(value.draft) &&
      typeof value.draft.title === "string"
    );
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMessage: TorchMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: promptText,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const assistantId = `ai-${Date.now()}`;
    const initialAssistantMessage: TorchMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolCalls: [],
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      const response = await fetch("/api/ai/torch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to Torch agent.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = "";
      const toolSteps: ToolCallStep[] = [];
      let detectedArtifact: TorchArtifact | undefined;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              const textContent: unknown = JSON.parse(line.slice(2));
              if (typeof textContent === "string") accumulatedContent += textContent;
            } else if (line.startsWith("9:")) {
              const toolCall: unknown = JSON.parse(line.slice(2));
              if (isRecord(toolCall) && typeof toolCall.toolName === "string") {
                toolSteps.push({
                  toolName: toolCall.toolName,
                  args: isRecord(toolCall.args) ? toolCall.args : undefined,
                  status: "calling",
                });
              }
            } else if (line.startsWith("a:")) {
              const toolResult: unknown = JSON.parse(line.slice(2));
              if (!isRecord(toolResult)) continue;

              const match =
                typeof toolResult.toolName === "string"
                  ? toolSteps.find((t) => t.toolName === toolResult.toolName)
                  : undefined;
              if (match && "result" in toolResult) {
                match.result = toolResult.result;
                match.status = "complete";
              }

              if (isArtifactResult(toolResult.result)) {
                if (toolResult.result.artifactType === "change_order_addendum") {
                  detectedArtifact = {
                    type: "change_order_addendum",
                    data: toolResult.result,
                    status: "pending",
                  };
                } else {
                  detectedArtifact = {
                    type: "create_deliverable_confirmation",
                    data: toolResult.result,
                    status: "pending",
                  };
                }
              }
            }
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: accumulatedContent || "Executing workspace action...",
                    toolCalls: [...toolSteps],
                    artifact: detectedArtifact || msg.artifact,
                  }
                : msg,
            ),
          );
        }
      }
    } catch (err) {
      console.error("[Torch Chat Error]:", err);
      toast.error("Torch execution failed. Please retry.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content || "I ran into an issue connecting to the workspace engine. Please try again.",
              }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmArtifact = async (
    messageId: string,
    actionType: ArtifactAction,
    payload: ArtifactConfirmationPayload,
  ) => {
    try {
      const res = await fetch("/api/ai/torch/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, payload }),
      });

      const data: ConfirmationResponse = await res.json();
      if (data.success) {
        toast.success("Action applied to workspace successfully!");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId && msg.artifact
              ? { ...msg, artifact: { ...msg.artifact, status: "approved" } }
              : msg,
          ),
        );
      } else {
        toast.error(data.error || "Failed to apply action.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to execute confirmation.");
    }
  };

  const rejectArtifact = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.artifact
          ? { ...msg, artifact: { ...msg.artifact, status: "rejected" } }
          : msg,
      ),
    );
    toast.info("Action cancelled.");
  };

  return (
    <TorchContext.Provider
      value={{
        messages,
        loading,
        orgName,
        projects,
        workspaceSummary,
        sendMessage,
        confirmArtifact,
        rejectArtifact,
        copiedId,
        copyMessage,
      }}
    >
      {children}
    </TorchContext.Provider>
  );
}
