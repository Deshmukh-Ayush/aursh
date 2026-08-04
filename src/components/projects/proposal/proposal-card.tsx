"use client";

import { Eye, Send, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProposalCardProps {
  proposal: any;
  role: string;
  isSending: boolean;
  isDeleting: boolean;
  onView: (proposal: any) => void;
  onSend: (proposalId: string) => void;
  onDelete: (proposalId: string) => void;
}

export function ProposalCard({
  proposal,
  role,
  isSending,
  isDeleting,
  onView,
  onSend,
  onDelete,
}: ProposalCardProps) {
  const lineItemsCount = proposal.lineItems?.length || 0;

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Send className="w-3.5 h-3.5" /> Sent to Client
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative bg-card border border-border/50 rounded-xl p-5 hover:border-border transition-all hover:shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {proposal.title}
            </h3>
            {getStatusBadge(proposal.status)}
          </div>
          {proposal.scopeSummary && (
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">{proposal.scopeSummary}</p>
          )}
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(proposal.price, proposal.currency)}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {lineItemsCount} line item{lineItemsCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Line Items Summary */}
      {proposal.lineItems && proposal.lineItems.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3 border border-border/30 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Included Scope & Deliverables
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground">
            {proposal.lineItems.slice(0, 4).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-2 bg-background/60 p-2 rounded-md border border-border/20">
                <span className="truncate text-muted-foreground font-medium">{item.description}</span>
                <span className="font-semibold tabular-nums shrink-0">
                  {formatCurrency(item.total, proposal.currency)}
                </span>
              </div>
            ))}
          </div>
          {proposal.lineItems.length > 4 && (
            <p className="text-[11px] text-muted-foreground text-center pt-1 font-medium">
              +{proposal.lineItems.length - 4} more item{proposal.lineItems.length - 4 !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
        <span className="text-[11px] text-muted-foreground">
          Created {new Date(proposal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(proposal)}
            className="h-8 text-xs px-3 active:scale-[0.96] transition-transform"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" /> View Proposal
          </Button>

          {proposal.status === "draft" && (role === "owner" || role === "agency") && (
            <>
              <Button
                size="sm"
                disabled={isSending}
                onClick={() => onSend(proposal.id)}
                className="h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.96] transition-transform"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {isSending ? "Sending..." : "Send to Client"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => onDelete(proposal.id)}
                className="h-8 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-[0.96] transition-transform"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
