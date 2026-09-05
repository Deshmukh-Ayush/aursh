"use client";

import * as React from "react";
import { parseJsonEventStream, uiMessageChunkSchema } from "ai";
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

export interface DraftInvoiceArtifactData {
  projectId: string;
  projectName: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  currency: string;
  draftInvoice: Record<string, unknown>;
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
    }
  | {
      type: "draft_invoice_confirmation";
      data: DraftInvoiceArtifactData;
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

export interface CreateInvoiceDraftPayload {
  projectId: string;
  draftInvoice: Record<string, unknown>;
}

export type ArtifactAction =
  | "create_deliverable"
  | "create_addendum_proposal"
  | "create_invoice_draft";
export type ArtifactConfirmationPayload =
  | CreateDeliverablePayload
  | CreateAddendumProposalPayload
  | CreateInvoiceDraftPayload;

interface ConfirmationResponse {
  success?: boolean;
  error?: string;
}

export interface ToolCallStep {
  toolName: string;
  toolCallId?: string;
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
  initialLoading: boolean;
  conversationId: string | null;
  startNewConversation: () => Promise<void>;
  orgName: string;
  userName?: string;
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
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
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
  userName?: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
}

export function TorchProvider({
  children,
  orgName,
  userName,
  projects,
  workspaceSummary,
}: TorchProviderProps) {
  const [messages, setMessages] = React.useState<TorchMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabledState] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("torch_web_search_enabled");
        if (saved !== null) return saved === "true";
      } catch {}
    }
    return false;
  });

  const setWebSearchEnabled = React.useCallback((enabled: boolean) => {
    setWebSearchEnabledState(enabled);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("torch_web_search_enabled", String(enabled));
      } catch {}
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    async function loadRecentConversation() {
      try {
        setInitialLoading(true);
        const res = await fetch("/api/ai/torch/conversations");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.conversation?.id) {
          setConversationId(data.conversation.id);
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("[Torch Context] Failed to load conversation:", err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }
    loadRecentConversation();
    return () => {
      isMounted = false;
    };
  }, []);

  const startNewConversation = React.useCallback(async () => {
    try {
      setMessages([]);
      setConversationId(null);
      const res = await fetch("/api/ai/torch/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data?.conversation?.id) {
        setConversationId(data.conversation.id);
      }
      toast.info("Started a new conversation.");
    } catch (err) {
      console.error("[Torch Context] Failed to create new conversation:", err);
    }
  }, []);

  const isRecord = (value: unknown): value is JsonObject =>
    typeof value === "object" && value !== null;

  const isArtifactResult = (
    value: unknown,
  ): value is
    | ({ artifactType: "change_order_addendum" } & ChangeOrderArtifactData)
    | ({ artifactType: "create_deliverable_confirmation" } & CreateDeliverableArtifactData)
    | ({ artifactType: "draft_invoice_confirmation" } & DraftInvoiceArtifactData) => {
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

    if (value.artifactType === "create_deliverable_confirmation") {
      return (
        typeof value.projectId === "string" &&
        typeof value.projectName === "string" &&
        isRecord(value.draft) &&
        typeof value.draft.title === "string"
      );
    }

    if (value.artifactType === "draft_invoice_confirmation") {
      return (
        typeof value.projectId === "string" &&
        typeof value.projectName === "string" &&
        typeof value.milestoneId === "string" &&
        typeof value.amount === "number" &&
        isRecord(value.draftInvoice)
      );
    }

    return false;
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

    let activeConvId = conversationId;
    if (!activeConvId) {
      try {
        const convRes = await fetch("/api/ai/torch/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: promptText.trim().slice(0, 60) }),
        });
        const convData = await convRes.json();
        if (convData?.conversation?.id) {
          activeConvId = convData.conversation.id;
          setConversationId(activeConvId);
        }
      } catch (err) {
        console.error("[Torch Context] Failed to start conversation:", err);
      }
    }

    if (activeConvId) {
      fetch("/api/ai/torch/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          id: userMessage.id,
          role: "user",
          content: userMessage.content,
        }),
      }).catch((e) => console.error("[Torch Save User Message Error]:", e));
    }

    try {
      const response = await fetch("/api/ai/torch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          enableWebSearch: webSearchEnabled,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to Torch agent.");
      }

      // AI SDK v7 UI message stream is SSE: each event is a `data:` JSON frame.
      const chunkStream = parseJsonEventStream({
        stream: response.body,
        schema: uiMessageChunkSchema,
      });

      const reader = chunkStream.getReader();
      let done = false;
      let accumulatedContent = "";
      const toolSteps: ToolCallStep[] = [];
      let detectedArtifact: TorchArtifact | undefined;
      let streamError: string | undefined;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (!value) continue;
        if (!value.success) continue;
        const part = value.value;
        if (!isRecord(part)) continue;

        switch (part.type) {
          case "text-delta": {
            if (typeof part.delta === "string") accumulatedContent += part.delta;
            break;
          }
          case "tool-input-available": {
            if (typeof part.toolName === "string") {
              toolSteps.push({
                toolName: part.toolName,
                toolCallId:
                  typeof part.toolCallId === "string" ? part.toolCallId : undefined,
                args: isRecord(part.input) ? part.input : undefined,
                status: "calling",
              });
            }
            break;
          }
          case "tool-input-error": {
            if (typeof part.errorText === "string") streamError = part.errorText;
            const idx = toolSteps.findIndex(
              (t) =>
                t.status === "calling" &&
                typeof part.toolCallId === "string" &&
                t.toolCallId === part.toolCallId,
            );
            if (idx >= 0) toolSteps[idx].status = "error";
            break;
          }
          case "tool-output-available": {
            const result = part.output;
            const matchIndex =
              typeof part.toolCallId === "string"
                ? toolSteps.findIndex((t) => t.toolCallId === part.toolCallId)
                : -1;
            if (matchIndex >= 0) {
              toolSteps[matchIndex].result = result;
              toolSteps[matchIndex].status = "complete";
            }

            if (isArtifactResult(result)) {
              if (result.artifactType === "change_order_addendum") {
                detectedArtifact = {
                  type: "change_order_addendum",
                  data: result,
                  status: "pending",
                };
              } else if (result.artifactType === "create_deliverable_confirmation") {
                detectedArtifact = {
                  type: "create_deliverable_confirmation",
                  data: result,
                  status: "pending",
                };
              } else if (result.artifactType === "draft_invoice_confirmation") {
                detectedArtifact = {
                  type: "draft_invoice_confirmation",
                  data: result,
                  status: "pending",
                };
              }
            }
            break;
          }
          case "tool-output-error": {
            if (typeof part.errorText === "string") streamError = part.errorText;
            const idx =
              typeof part.toolCallId === "string"
                ? toolSteps.findIndex((t) => t.toolCallId === part.toolCallId)
                : -1;
            if (idx >= 0) toolSteps[idx].status = "error";
            break;
          }
          case "error": {
            if (typeof part.errorText === "string") streamError = part.errorText;
            break;
          }
          default:
            break;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: accumulatedContent,
                  toolCalls: [...toolSteps],
                  artifact: detectedArtifact || msg.artifact,
                }
              : msg,
          ),
        );
      }

      // Guarantee the agent always leaves a visible message.
      let finalContent = accumulatedContent;
      if (!finalContent.trim()) {
        const erroredTool = toolSteps.find((t) => t.status !== "complete");
        finalContent = streamError
          ? `I ran into a problem: ${streamError}`
          : erroredTool
            ? `I tried to run \`${erroredTool.toolName}\` but didn't get a result back. Please try rephrasing or check the project details.`
            : "I wasn't able to produce a response. Please try again.";
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId) return msg;
          return {
            ...msg,
            content: finalContent,
            toolCalls: [...toolSteps],
            artifact: detectedArtifact || msg.artifact,
          };
        }),
      );

      // Persist completed assistant turn
      if (activeConvId) {
        fetch("/api/ai/torch/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConvId,
            id: assistantId,
            role: "assistant",
            content: finalContent,
            toolCalls: toolSteps.length > 0 ? toolSteps : undefined,
            artifact: detectedArtifact,
          }),
        }).catch((e) => console.error("[Torch Save Assistant Message Error]:", e));
      }
    } catch (err) {
      console.error("[Torch Chat Error]:", err);
      toast.error("Torch execution failed. Please retry.");
      const errorFallback = "I ran into an issue connecting to the workspace engine. Please try again.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: msg.content || errorFallback,
              }
            : msg,
        ),
      );

      if (activeConvId) {
        fetch("/api/ai/torch/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConvId,
            id: assistantId,
            role: "assistant",
            content: errorFallback,
          }),
        }).catch((e) => console.error("[Torch Save Error Fallback Message]:", e));
      }
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

        // Sync approved status to database
        fetch("/api/ai/torch/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            status: "approved",
          }),
        }).catch((e) => console.error("[Torch Sync Approved Artifact Error]:", e));
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
    // Sync rejected status to database
    fetch("/api/ai/torch/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        status: "rejected",
      }),
    }).catch((e) => console.error("[Torch Sync Rejected Artifact Error]:", e));

    toast.info("Action cancelled.");
  };

  return (
    <TorchContext.Provider
      value={{
        messages,
        loading,
        initialLoading,
        conversationId,
        startNewConversation,
        orgName,
        userName,
        projects,
        workspaceSummary,
        sendMessage,
        confirmArtifact,
        rejectArtifact,
        copiedId,
        copyMessage,
        webSearchEnabled,
        setWebSearchEnabled,
      }}
    >
      {children}
    </TorchContext.Provider>
  );
}
