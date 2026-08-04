"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "vaul";
import { ProposalTabFilter } from "./proposal-tab-filter";
import { ProposalCard } from "./proposal-card";
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

      {/* Composed Filter Tabs */}
      <ProposalTabFilter activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

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
          {filteredProposals.map((prop) => (
            <ProposalCard
              key={prop.id}
              proposal={prop}
              role={role}
              isSending={isSending === prop.id}
              isDeleting={isDeleting === prop.id}
              onView={(p) => {
                setSelectedProposal(p);
                setIsPreviewOpen(true);
              }}
              onSend={handleSendProposal}
              onDelete={handleDeleteProposal}
            />
          ))}
        </div>
      )}

      {/* Build Proposal Drawer (Vaul Bottom-to-Top) */}
      <Drawer.Root open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 flex flex-col rounded-t-[24px] bg-background border-t border-border/40 shadow-2xl overflow-hidden focus:outline-hidden">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted-foreground/30 my-3" />
            <div className="overflow-y-auto px-4 sm:px-8 pb-10 pt-2 max-w-4xl mx-auto w-full flex-1">
              <Drawer.Title className="text-xl font-bold text-foreground">Build Project Proposal</Drawer.Title>
              <Drawer.Description className="text-xs text-muted-foreground mb-6">
                Define line items & scope for this project. Line items will automatically become deliverables & payment milestones upon client acceptance.
              </Drawer.Description>
              <ProposalBuilder projectId={projectId} onComplete={() => setIsBuilderOpen(false)} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Preview Proposal Drawer (Vaul Bottom-to-Top) */}
      <Drawer.Root open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 flex flex-col rounded-t-[24px] bg-background border-t border-border/40 shadow-2xl overflow-hidden focus:outline-hidden">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted-foreground/30 my-3" />
            <div className="overflow-y-auto px-4 sm:px-8 pb-10 pt-2 max-w-4xl mx-auto w-full flex-1">
              <Drawer.Title className="sr-only">Proposal Details</Drawer.Title>
              <Drawer.Description className="sr-only">View project proposal details and line items</Drawer.Description>
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
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
