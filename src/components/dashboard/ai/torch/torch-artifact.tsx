"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddendumLineItem, useTorch, TorchMessage } from "./torch-context";
import { Check, X, FileText, PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TorchArtifactProps {
  message: TorchMessage;
}

const appear = {
  initial: { opacity: 0, scale: 0.97, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -2 },
  transition: { type: "spring" as const, duration: 0.4, bounce: 0 },
};

export function TorchArtifact({ message }: TorchArtifactProps) {
  const { confirmArtifact, rejectArtifact } = useTorch();
  const artifact = message.artifact;

  if (!artifact) return null;

  if (artifact.type === "change_order_addendum") {
    const addendum = artifact.data.addendum;
    const isPending = artifact.status === "pending";

    return (
      <motion.div {...appear} className="mt-3">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-xs">
          {/* Hierarchy: the price delta is the dominant element via size/weight. */}
          <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-semibold text-foreground">
                {addendum.title || "Change Order SOW Addendum"}
              </span>
            </div>
            <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-foreground">
              +{addendum.additionalPrice}{" "}
              <span className="text-xs font-semibold text-muted-foreground">
                {addendum.currency || "USD"}
              </span>
            </span>
          </div>

          <div className="px-4 pb-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {addendum.summary}
            </p>
          </div>

          {addendum.lineItems && addendum.lineItems.length > 0 && (
            <div className="space-y-1 px-4 pb-2.5">
              {addendum.lineItems.map((item: AddendumLineItem, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.description}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {item.amount} {addendum.currency}
                  </span>
                </div>
              ))}
            </div>
          )}

          <ArtifactFooter
            isPending={isPending}
            status={artifact.status}
            confirmLabel="Create proposal SOW"
            rejectLabel="Discard"
            onConfirm={() =>
              confirmArtifact(message.id, "create_addendum_proposal", {
                projectId: artifact.data.projectId,
                addendum,
              })
            }
            onReject={() => rejectArtifact(message.id)}
            resolvedText={
              artifact.status === "approved"
                ? "Proposal created in project workspace"
                : "Addendum discarded"
            }
          />
        </div>
      </motion.div>
    );
  }

  if (artifact.type === "create_deliverable_confirmation") {
    const draft = artifact.data.draft;
    const isPending = artifact.status === "pending";

    return (
      <motion.div {...appear} className="mt-3">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-xs">
          {/* Hierarchy: the deliverable title dominates; project is metadata. */}
          <div className="flex items-start gap-2 px-4 pt-3.5 pb-2">
            <PackagePlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">
                {draft.title || "New deliverable"}
              </div>
              <div className="text-xs text-muted-foreground">
                {artifact.data.projectName}
              </div>
            </div>
          </div>

          {draft.description && (
            <div className="px-4 pb-2.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {draft.description}
              </p>
            </div>
          )}

          <ArtifactFooter
            isPending={isPending}
            status={artifact.status}
            confirmLabel="Approve & create"
            rejectLabel="Cancel"
            onConfirm={() =>
              confirmArtifact(message.id, "create_deliverable", {
                projectId: artifact.data.projectId,
                title: draft.title,
                description: draft.description,
                dueDate: draft.dueDate,
              })
            }
            onReject={() => rejectArtifact(message.id)}
            resolvedText={
              artifact.status === "approved"
                ? "Deliverable added to workspace"
                : "Creation cancelled"
            }
          />
        </div>
      </motion.div>
    );
  }

  return null;
}

/**
 * Shared footer: a single primary action and a low-emphasis text "reject"
 * affordance (not a competing outline button). When resolved, the action row
 * crossfades into a calm confirm-or-discard state with an animated glyph.
 */
function ArtifactFooter({
  isPending,
  status,
  confirmLabel,
  rejectLabel,
  onConfirm,
  onReject,
  resolvedText,
}: {
  isPending: boolean;
  status: "pending" | "approved" | "rejected";
  confirmLabel: string;
  rejectLabel: string;
  onConfirm: () => void;
  onReject: () => void;
  resolvedText: string;
}) {
  return (
    <div className="border-t border-border/40 px-4 py-2.5">
      <AnimatePresence mode="wait" initial={false}>
        {isPending ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-end gap-3"
          >
            <button
              type="button"
              onClick={onReject}
              className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {rejectLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <Check className="h-3.5 w-3.5" />
              {confirmLabel}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="resolved"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="flex items-center gap-1.5 text-xs"
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full",
                status === "approved"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {status === "approved" ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <X className="h-2.5 w-2.5" />
              )}
            </span>
            <span className="text-muted-foreground">{resolvedText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
