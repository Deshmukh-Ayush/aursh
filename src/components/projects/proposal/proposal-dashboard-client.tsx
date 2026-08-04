"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Send, CheckCircle2, XCircle, Clock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProposalBuilder } from "./proposal-builder";
import { ProposalClientView } from "./proposal-client-view";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProposalDashboardClientProps {
  projectId: string;
  proposals: any[];
  role: string;
}

export function ProposalDashboardClient({ projectId, proposals, role }: ProposalDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "sent" | "accepted" | "declined">("all");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === "all") return true;
    return p.status === activeTab;
  });

  const handleSendProposal = async (proposalId: string) => {
    try {
      setIsSending(proposalId);
      await axios.patch("/api/proposals", { proposalId, action: "send" });
      toast.success("Proposal sent to client successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send proposal");
    } finally {
      setIsSending(null);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    try {
      setIsDeleting(proposalId);
      await axios.delete(`/api/proposals?proposalId=${proposalId}`);
      toast.success("Draft proposal deleted");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete proposal");
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
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

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: "all", label: "All Proposals", count: proposals.length },
    { id: "draft", label: "Drafts", count: proposals.filter((p) => p.status === "draft").length },
    { id: "sent", label: "Sent", count: proposals.filter((p) => p.status === "sent").length },
    { id: "accepted", label: "Accepted", count: proposals.filter((p) => p.status === "accepted").length },
    { id: "declined", label: "Declined", count: proposals.filter((p) => p.status === "declined").length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Proposals & Scope Estimates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create structured estimates. Accepting a proposal automatically generates project deliverables & payment milestones.
          </p>
        </div>
        {(role === "owner" || role === "agency") && (
          <Button
            onClick={() => setIsBuilderOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-medium text-xs h-9 px-4 active:scale-[0.96] transition-transform flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Build New Proposal
          </Button>
        )}
      </div>

      {/* Morphing Nav Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/40 w-fit max-w-full overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="proposal-tab-pill"
                  className="absolute inset-0 bg-background rounded-lg shadow-xs border border-border/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                    isActive ? "bg-primary/15 text-primary font-bold" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Proposals List or Empty State */}
      {filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
          <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Proposals Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {activeTab === "all"
              ? "Build a structured proposal with line items to automatically map project deliverables & payment milestones upon acceptance."
              : `No proposals with status "${activeTab}".`}
          </p>
          {(role === "owner" || role === "agency") && (
            <Button
              onClick={() => setIsBuilderOpen(true)}
              className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 px-4 font-medium active:scale-[0.96] transition-transform"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Build First Proposal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProposals.map((prop) => {
            const lineItemsCount = prop.lineItems?.length || 0;
            return (
              <div
                key={prop.id}
                className="group relative bg-card border border-border/50 rounded-xl p-5 hover:border-border transition-all hover:shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {prop.title}
                      </h3>
                      {getStatusBadge(prop.status)}
                    </div>
                    {prop.scopeSummary && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">{prop.scopeSummary}</p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {formatCurrency(prop.price, prop.currency)}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {lineItemsCount} line item{lineItemsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Line Items Summary */}
                {prop.lineItems && prop.lineItems.length > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 border border-border/30 space-y-2">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Included Scope & Deliverables
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground">
                      {prop.lineItems.slice(0, 4).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 bg-background/60 p-2 rounded-md border border-border/20">
                          <span className="truncate text-muted-foreground font-medium">{item.description}</span>
                          <span className="font-semibold tabular-nums shrink-0">
                            {formatCurrency(item.total, prop.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {prop.lineItems.length > 4 && (
                      <p className="text-[11px] text-muted-foreground text-center pt-1 font-medium">
                        +{prop.lineItems.length - 4} more item{prop.lineItems.length - 4 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Created {new Date(prop.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProposal(prop);
                        setIsPreviewOpen(true);
                      }}
                      className="h-8 text-xs px-3 active:scale-[0.96] transition-transform"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View Proposal
                    </Button>

                    {prop.status === "draft" && (role === "owner" || role === "agency") && (
                      <>
                        <Button
                          size="sm"
                          disabled={isSending === prop.id}
                          onClick={() => handleSendProposal(prop.id)}
                          className="h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.96] transition-transform"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          {isSending === prop.id ? "Sending..." : "Send to Client"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting === prop.id}
                          onClick={() => handleDeleteProposal(prop.id)}
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
          })}
        </div>
      )}

      {/* Build Proposal Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Build Project Proposal</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define the scope and line items for this project. Line items will automatically become deliverables & payment milestones upon client acceptance.
            </DialogDescription>
          </DialogHeader>
          <ProposalBuilder projectId={projectId} onComplete={() => setIsBuilderOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Preview Proposal Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Proposal Preview</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <ProposalClientView
              proposal={selectedProposal}
              role={role}
              onAccepted={() => {
                setIsPreviewOpen(false);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
