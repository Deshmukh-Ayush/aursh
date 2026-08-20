"use client";

import * as React from "react";
import { useTorch, TorchMessage } from "./torch-context";
import { Button } from "@/components/ui/button";
import { Check, X, FileText, PackagePlus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TorchArtifactProps {
  message: TorchMessage;
}

export function TorchArtifact({ message }: TorchArtifactProps) {
  const { confirmArtifact, rejectArtifact } = useTorch();
  const artifact = message.artifact;

  if (!artifact) return null;

  if (artifact.type === "change_order_addendum") {
    const addendum = artifact.data.addendum;
    const isPending = artifact.status === "pending";

    return (
      <div className="mt-3 rounded-lg border border-border/60 bg-background p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-brand">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              {addendum.title || "Change Order SOW Addendum"}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            +{addendum.additionalPrice} {addendum.currency || "USD"}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {addendum.summary}
        </p>

        {addendum.lineItems && addendum.lineItems.length > 0 && (
          <div className="space-y-1.5 border-t border-border/40 pt-2">
            {addendum.lineItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{item.description}</span>
                <span className="font-mono text-foreground font-medium">
                  {item.amount} {addendum.currency}
                </span>
              </div>
            ))}
          </div>
        )}

        {isPending ? (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5"
              onClick={() => rejectArtifact(message.id)}
            >
              <X className="h-3 w-3 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px] px-2.5 bg-brand text-white hover:bg-brand/90"
              onClick={() =>
                confirmArtifact(message.id, "create_addendum_proposal", {
                  projectId: artifact.data.projectId,
                  addendum,
                })
              }
            >
              <Check className="h-3 w-3 mr-1" />
              Create Proposal SOW
            </Button>
          </div>
        ) : (
          <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                artifact.status === "approved" ? "bg-emerald-500" : "bg-muted-foreground",
              )}
            />
            <span>
              {artifact.status === "approved"
                ? "Proposal created in project workspace"
                : "Addendum discarded"}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (artifact.type === "create_deliverable_confirmation") {
    const draft = artifact.data.draft;
    const isPending = artifact.status === "pending";

    return (
      <div className="mt-3 rounded-lg border border-border/60 bg-background p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-brand">
              <PackagePlus className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              New Deliverable Draft: {draft.title}
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {artifact.data.projectName}
          </span>
        </div>

        {draft.description && (
          <p className="text-[11px] text-muted-foreground">{draft.description}</p>
        )}

        {isPending ? (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5"
              onClick={() => rejectArtifact(message.id)}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px] px-2.5 bg-brand text-white hover:bg-brand/90"
              onClick={() =>
                confirmArtifact(message.id, "create_deliverable", {
                  projectId: artifact.data.projectId,
                  title: draft.title,
                  description: draft.description,
                  dueDate: draft.dueDate,
                })
              }
            >
              <Check className="h-3 w-3 mr-1" />
              Approve & Create
            </Button>
          </div>
        ) : (
          <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                artifact.status === "approved" ? "bg-emerald-500" : "bg-muted-foreground",
              )}
            />
            <span>
              {artifact.status === "approved"
                ? "Deliverable added to workspace"
                : "Creation cancelled"}
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
