"use client";

import * as React from "react";
import { motion } from "motion/react";
import { AddendumLineItem, useTorch, TorchMessage } from "./torch-context";
import { FileText, PackagePlus } from "lucide-react";
import { ApprovalCard, type ApprovalCardStatus } from "@/components/agents/approval-card";

export interface TorchArtifactProps {
  message: TorchMessage;
}

const appear = {
  initial: { opacity: 0, scale: 0.97, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -2 },
  transition: { type: "spring" as const, duration: 0.4, bounce: 0 },
};

/**
 * Maps Torch's internal artifact status onto beUI's ApprovalCardStatus.
 * Both share "pending"/"approved"/"rejected" verbatim — this is just a
 * typed passthrough that keeps the mapping explicit rather than implicit.
 */
/**
 * Maps Torch's internal artifact status onto beUI's ApprovalCardStatus.
 * TorchArtifact.status is "pending" | "approved" | "rejected", which is a
 * subset of ApprovalCardStatus — this is a typed passthrough that keeps the
 * mapping explicit rather than implicit.
 */
function toApprovalStatus(
  status: "pending" | "approved" | "rejected",
): ApprovalCardStatus {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

export function TorchArtifact({ message }: TorchArtifactProps) {
  const { confirmArtifact, rejectArtifact } = useTorch();
  const artifact = message.artifact;

  if (!artifact) return null;

  if (artifact.type === "change_order_addendum") {
    const addendum = artifact.data.addendum;
    const status = toApprovalStatus(artifact.status);

    return (
      <motion.div {...appear} className="mt-3">
        {/*
          ApprovalCard in non-question mode: no `questions` prop, so it renders
          the `description` + `children` + a single approve/reject action row.
          This is for approving the *output* of a tool that already ran, not
          for granting permission to execute — which is why ApprovalCard fits
          and ToolApproval does not.
        */}
        <ApprovalCard
          title={addendum.title || "Change Order SOW Addendum"}
          description={addendum.summary}
          status={status}
          approveLabel="Create proposal SOW"
          onApprove={() =>
            confirmArtifact(message.id, "create_addendum_proposal", {
              projectId: artifact.data.projectId,
              addendum,
            })
          }
          onReject={() => rejectArtifact(message.id)}
          result={
            status === "approved"
              ? "Proposal created in project workspace"
              : "Addendum discarded"
          }
          className="bg-background border border-border/60 shadow-xs"
        >
          {/* Hierarchy: the price delta is the dominant element via size/weight. */}
          <div className="overflow-hidden rounded-lg border border-border/40">
            <div className="flex items-baseline justify-between gap-3 bg-muted/40 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground">
                  Proposed change
                </span>
              </div>
              <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-foreground">
                +{addendum.additionalPrice}{" "}
                <span className="text-[13px] font-semibold text-muted-foreground">
                  {addendum.currency || "USD"}
                </span>
              </span>
            </div>

            {addendum.lineItems && addendum.lineItems.length > 0 && (
              <div className="space-y-1 px-3 py-2.5">
                {addendum.lineItems.map((item: AddendumLineItem, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{item.description}</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {item.amount} {addendum.currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ApprovalCard>
      </motion.div>
    );
  }

  if (artifact.type === "create_deliverable_confirmation") {
    const draft = artifact.data.draft;
    const status = toApprovalStatus(artifact.status);

    return (
      <motion.div {...appear} className="mt-3">
        <ApprovalCard
          title={draft.title || "New deliverable"}
          description={draft.description ?? undefined}
          status={status}
          approveLabel="Approve & create"
          onApprove={() =>
            confirmArtifact(message.id, "create_deliverable", {
              projectId: artifact.data.projectId,
              title: draft.title,
              description: draft.description,
              dueDate: draft.dueDate,
            })
          }
          onReject={() => rejectArtifact(message.id)}
          result={
            status === "approved"
              ? "Deliverable added to workspace"
              : "Creation cancelled"
          }
          className="bg-background border border-border/60 shadow-xs"
        >
          <div className="flex items-start gap-2">
            <PackagePlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-muted-foreground">
                {artifact.data.projectName}
              </div>
            </div>
          </div>
        </ApprovalCard>
      </motion.div>
    );
  }

  if (artifact.type === "draft_invoice_confirmation") {
    const data = artifact.data;
    const draft = data.draftInvoice as {
      invoiceNumber?: string;
      currency?: "USD" | "INR";
      amount?: number;
      dueDate?: string;
      clientSnapshot?: { name?: string; email?: string };
    };
    const status = toApprovalStatus(artifact.status);
    const invoiceNumber = draft?.invoiceNumber || "Draft Invoice";
    const clientName = draft?.clientSnapshot?.name || "Client";
    const clientEmail = draft?.clientSnapshot?.email || "";

    return (
      <motion.div {...appear} className="mt-3">
        <ApprovalCard
          title={`Draft Invoice: ${invoiceNumber}`}
          description={`Milestone: ${data.milestoneTitle} (${data.projectName})`}
          status={status}
          approveLabel="Save draft invoice"
          onApprove={() =>
            confirmArtifact(message.id, "create_invoice_draft", {
              projectId: data.projectId,
              draftInvoice: data.draftInvoice,
            })
          }
          onReject={() => rejectArtifact(message.id)}
          result={
            status === "approved"
              ? "Draft invoice saved to workspace"
              : "Invoice draft discarded"
          }
          className="bg-background border border-border/60 shadow-xs"
        >
          {/* Hierarchy: Amount is prominent */}
          <div className="overflow-hidden rounded-lg border border-border/40">
            <div className="flex items-baseline justify-between gap-3 bg-muted/40 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground">
                  Invoice amount
                </span>
              </div>
              <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-foreground">
                {data.amount}{" "}
                <span className="text-[13px] font-semibold text-muted-foreground">
                  {data.currency || "USD"}
                </span>
              </span>
            </div>

            <div className="space-y-1 px-3 py-2 text-[13px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Client</span>
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {clientName} {clientEmail ? `(${clientEmail})` : ""}
                </span>
              </div>
              {draft.dueDate && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Due Date</span>
                  <span className="font-mono text-foreground">{draft.dueDate}</span>
                </div>
              )}
            </div>
          </div>
        </ApprovalCard>
      </motion.div>
    );
  }

  return null;
}
