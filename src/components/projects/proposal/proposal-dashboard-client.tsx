"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { ProposalDonutChart } from "./proposal-donut-chart";
import { ProposalCard } from "./proposal-card";
import { ProposalBuilderDrawer } from "./proposal-builder-drawer";
import { ProposalPreviewDrawer } from "./proposal-preview-drawer";
import { useUIStore } from "@/store/ui-store";
import { useProposalStore } from "@/store/proposal-store";
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
  const setProposalBuilderOpen = useUIStore((state) => state.setProposalBuilderOpen);
  const setProposalPreviewOpen = useUIStore((state) => state.setProposalPreviewOpen);
  const setSelectedProposal = useProposalStore((state) => state.setSelectedProposal);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);

  const formatMoney = (amount: number, curr: string = "INR") => {
    if (curr === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

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

  const isAgency = role === "owner" || role === "agency";

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance">
            Proposals
          </h1>
        </div>

        {isAgency && (
          <button
            onClick={() => setProposalBuilderOpen(true)}
            className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5 stroke-3" />
            <span>New Proposal</span>
          </button>
        )}
      </div>

      {/* Donut Sales Pipeline Distribution Chart */}
      <ProposalDonutChart proposals={proposals} formatMoney={formatMoney} />

      {/* Proposals List Section */}
      <section aria-label="Project Proposals List" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            All Scheduled Proposals ({proposals.length})
          </h2>
        </div>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Proposals Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Build a structured proposal with line items to automatically map project deliverables & payment milestones upon acceptance.
            </p>
            {isAgency && (
              <button
                onClick={() => setProposalBuilderOpen(true)}
                className="mt-5 active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Build First Proposal
              </button>
            )}
          </div>
        ) : (
          <div>
            {proposals.map((prop, index) => (
              <ProposalCard
                key={prop.id}
                proposal={prop}
                role={role}
                isSending={isSending === prop.id}
                isDeleting={isDeleting === prop.id}
                index={index}
                onView={(p) => {
                  setSelectedProposal(p);
                  setProposalPreviewOpen(true);
                }}
                onSend={handleSendProposal}
                onDelete={handleDeleteProposal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modularized Builder & Preview Drawers */}
      <ProposalBuilderDrawer projectId={projectId} />
      <ProposalPreviewDrawer role={role} />
    </div>
  );
}
